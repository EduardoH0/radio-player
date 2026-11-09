// icy-reader.ts


export async function startIcyReader(
    url: string,
    onMetadata: (title: string) => void,
    signal?: AbortSignal
): Promise<void> {
    try {
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
        console.log(`MetaintHeader: ${metaintHeader}`);

        const metaint = Number(metaintHeader);
        if (!Number.isSafeInteger(metaint) || metaint <= 0) {
            throw new Error(`Invalid icy-metaint value: ${metaintHeader}`);
        }
        console.log(`metaint: ${metaint}`);

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Response has no readable body");
        }

        const streamReader = new IcyStreamReader(reader);

        while (!signal?.aborted) {
            // Read/skip audio (size == metaint)
            await streamReader.readBytes(metaint);  // nothing to do with returned audio
            // Read length byte (size == 1)
            const [lengthByte] = await streamReader.readBytes(1);
            const metadataLength = 16 * lengthByte;
            console.log(`lengthByte: ${lengthByte}`);

            if (metadataLength === 0) {
                continue;
            }

            // Read metadata
            const metadataBytes = await streamReader.readBytes(metadataLength);

            // Decode
            const decodedData = decodeMetadata(metadataBytes);
            console.log(`decodedData: ${decodedData}`);

            if (decodedData) {
                onMetadata(decodedData);
            }
        }


    } catch (error) {
        if (error instanceof Error && error.name === "AbortError" ) {
            return;
        }

        console.error(`Could not fetch ${url} with Icy-MetaData header`, error);
    }
}


class IcyStreamReader {
    private buffer: Uint8Array;
    private reader: ReadableStreamDefaultReader<Uint8Array>;

    constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
        this.buffer = new Uint8Array(0);
        this.reader = reader;
    }

    async readBytes(count: number): Promise<Uint8Array> {
        while (this.buffer.length < count) {
            const { value, done } = await this.reader.read();

            if (done) {
                throw new Error("Stream ended unexpectedly");
            }

            // NOTE: We are creating new array and copying
            // It is simple but not the most efficient. Track behaviour...
            const next = new Uint8Array(this.buffer.length + value.length);
            next.set(this.buffer);
            next.set(value, this.buffer.length);  // add value with buffer.length offset

            this.buffer = next;
        }

        const result = this.buffer.slice(0, count);
        // update buffer with offset for next read
        this.buffer = this.buffer.slice(count);

        return result;
    }
}


function decodeMetadata(metadataBytes: Uint8Array): string | null {
    const metadata = new TextDecoder().decode(metadataBytes)
    // block padded with null characters (\0) to reach a multiple of 16 bytes
    const text = metadata.replace(/\0+$/, "");
    console.log(`text: ${text}`);
    // look for `StreamTitle`; not 100% sure this is the key in all cases...
    // stop at first `';`
    const match = text.match(/StreamTitle='(.*?)';/)
    if (match) {
        console.log(match[1]);
    }

    return match?.[1] || null
}
