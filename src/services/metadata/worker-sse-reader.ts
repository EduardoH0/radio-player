// worker-sse-reader.ts
const WORKER_URL = import.meta.env.VITE_METADATA_WORKER_URL;


export async function startWorkerSse(
    url: string,
    onMetadata: (title: string) => void,
    signal: AbortSignal
): Promise<void> {
    const stationId = await hashStationUrl(url);
    if (signal.aborted) return;

    const endpoint = new URL("/metadata", WORKER_URL);
    endpoint.searchParams.set("station", stationId);

    const eventSource = new EventSource(endpoint);

    return new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
            eventSource.close();
            signal.removeEventListener("abort", stop);
            eventSource.onmessage = null;
            eventSource.onerror = null;
        }

        const finish = (error?: Error) => {
            if (settled) return;

            settled = true;
            cleanup();

            if (error) {
                reject(error);
            } else {
                resolve();
            }
        }

        const stop = () => finish();

        signal.addEventListener("abort", stop, { once: true }); 

        eventSource.onmessage = (event: MessageEvent) => {
            let data: { title?: unknown };
            try {
                data = JSON.parse(event.data);
            } catch {
                finish(new Error("Invalid SSE message"));
                return;
            }

            if (typeof data.title === "string") {
                onMetadata(data.title);
            }
        }

        eventSource.onerror = () => {
            // CONNECTING means EventSource is attempting to reconnect
            // CLOSED means it has given up.
            if (eventSource.readyState === eventSource.CLOSED) {
                finish(new Error("SSE connection closed."));
            }
        }
    });
}


async function hashStationUrl(url: string): Promise<string> {
    const normalizedUrl = new URL(url).href;
    const data = new TextEncoder().encode(normalizedUrl);
    const hash = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}
