// icy-parser.ts


export async function parseIcyStream(
    body: ReadableStream<Uint8Array>,
    metaint: number,
    onMetadata: (title: string) => void,
    signal?: AbortSignal
): Promise<void> {

    const reader = body.getReader();
    const streamReader = new IcyStreamReader(reader);

    while (!signal?.aborted) {
        // Read-skip audio (size == metaint)
        await streamReader.readBytes(metaint);  // nothing to do with returned audio

        // Read length byte (size == 1)
        const [lengthByte] = await streamReader.readBytes(1);
        const metadataLength = 16 * lengthByte;

        if (metadataLength === 0) {
            continue;
        }

        // Read metadata and decode
        const metadataBytes = await streamReader.readBytes(metadataLength);
        const decodedData = decodeMetadata(metadataBytes);

        if (decodedData) {
            onMetadata(decodedData);
        }
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
    // look for `StreamTitle`; not 100% sure this is the key in all cases...
    // stop at first `';`
    const match = text.match(/StreamTitle='(.*?)';/)

    return match?.[1] || null
}
