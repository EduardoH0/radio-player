// metadata-service.ts
import { startIcyReader } from "./icy-reader";


export class MetadataService{
    private controller: AbortController | null;

    constructor() {
        this.controller = null;
    }

    start(url: string, onMetadata: (title: string) => void): void {
        this.stop()

        this.controller = new AbortController();

        startIcyReader(url, onMetadata, this.controller.signal);
    }

    stop(): void {
        this.controller?.abort();
        this.controller = null;
    }
}
