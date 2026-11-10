// index.ts
import { parseIcyStream } from "../../src/services/metadata/icy-parser";
import STATIONS from "./stations";

interface Env {
    ENVIRONMENT: "development" | "production";
}

const encoder = new TextEncoder();

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // CORS access control
        const allowedOrigins = env.ENVIRONMENT === "development"
            ? new Set([
                "http://localhost:5173",
                "https://localhost:5173",
                "https://eduardoh0.github.io"
            ])
            : new Set([
                "https://eduardoh0.github.io"
            ]);

        const origin = request.headers.get("Origin");

        if (origin && !allowedOrigins.has(origin)) {
            return new Response("Origin not allowed", { status: 403 });
        }

        const corsHeaders: HeadersInit = origin ? {
            "Access-Control-Allow-Origin": origin,
            // Avoid cache issues with requests coming from different places, e.g.:
            // from local frontend and deployed frontend.
            "Vary": "Origin"  
        } : {};

        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    ...corsHeaders,
                    "Access-Control-Allow-Methods": "GET, OPTIONS"
                }
            });
        }

        if (request.method !== "GET" || url.pathname !== "/metadata") {
            return new Response("Not found", {
                status: 404,
                headers: corsHeaders
            });
        }

        const stationId = url.searchParams.get("station");
        const stationUrl = stationId ? STATIONS[stationId] : undefined;

        if (!stationUrl) {
            return new Response("Unknown station", {
                status: 400,
                headers: corsHeaders
            });
        }

        const abortController = new AbortController();

        let upstream: Response;

        try {
            upstream = await fetch(stationUrl, {
                headers: {
                    "Icy-MetaData": "1",
                    // Needed to bypass occasional 403 error (Forbidden)
                    "User-Agent": "Mozilla/5.0"  // Needed to bypass 403 error 
                },
                signal: abortController.signal
            });

            if (!upstream.ok) {
                throw new Error(`Upstream HTTP error: ${upstream.status}`);
            }

            const metaintHeader = upstream.headers.get("icy-metaint");

            if (!metaintHeader) {
                throw new Error("Missing icy-metaint response header");
            }

            const metaint = Number(metaintHeader);

            if (!Number.isSafeInteger(metaint) || metaint <= 0) {
                throw new Error(`Invalid icy-metaint: ${metaintHeader}`);
            }

            if (!upstream.body) {
                throw new Error("Upstream response has no body");
            }

            const stream = createMetadataStream(
                upstream.body,
                metaint,
                abortController
            );

            return new Response(stream, {
                headers: {
                    ...corsHeaders,
                    // Tell the client that the response follows the Server-Sent
                    // Events format (SSE)
                    "Content-Type": "text/event-stream; charset=utf-8",
                    "Cache-Control": "no-cache, no-transform"
                }
            });
        } catch (error) {
            abortController.abort();

            console.error("Could not connect to upstream station:", error);

            return new Response("Could not connect to station", {
                status: 502, // Bad Gateway
                headers: corsHeaders
            });
        }
    }
};

function createMetadataStream(
    body: ReadableStream<Uint8Array>,
    metaint: number,
    abortController: AbortController
): ReadableStream<Uint8Array> {

    // Track whether the client has cancelled the stream
    let cancelled = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    return new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (data: string) => {
                if (!cancelled) {
                    controller.enqueue(encoder.encode(data));
                }
            };

            // Send on connected to check everything working
            send(": connected\n\n");

            // Keep connection active.
            // Avoid potential automatic closing of connection if idle for
            // too long...
            heartbeat = setInterval(() => {
                send(": keep-alive\n\n");
            }, 15_000);

            void (async () => {
                try {
                    await parseIcyStream(
                        body,
                        metaint,
                        (title) => {
                            send(`data: ${JSON.stringify({ title })}\n\n`);
                        },
                        abortController.signal
                    );

                    if (!cancelled) {
                        controller.close();
                    }
                } catch (error) {
                    if (!cancelled) {
                        controller.error(error);
                    }
                } finally {
                    if (heartbeat) {
                        clearInterval(heartbeat);
                    }
                }
            })();
        },

        cancel(reason) {
            cancelled = true;
            abortController.abort(reason);

            if (heartbeat) {
                clearInterval(heartbeat);
            }
        }
    });
}
