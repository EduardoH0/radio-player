// icy-reader.ts
import { parseIcyStream } from "./icy-parser";


export async function startIcyReader(
    url: string,
    onMetadata: (title: string) => void,
    signal?: AbortSignal
): Promise<void> {
    // Tell server the client supports Icy-MetaData
    const response = await fetch(
        url,
        {
            headers: { "Icy-MetaData": "1" },
            // Let `player.ts` stop the metadata connection on station change
            // or playback stop.
            signal
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
    }

    // Get number of audio bytes between metadata blocks
    const metaintHeader = response.headers.get("icy-metaint");

    if (!metaintHeader) {
        throw new Error("Missing icy-metaint response header");
    }

    const metaint = Number(metaintHeader);

    if (!Number.isSafeInteger(metaint) || metaint <= 0) {
        throw new Error(`Invalid icy-metaint value: ${metaintHeader}`);
    }

    if (!response.body) {
        throw new Error("Response has no readable body");
    }

    await parseIcyStream(
        response.body,
        metaint,
        onMetadata,
        signal
    );
}
