// metadata-service.ts

type MetadataSource = (
    url: string,
    onMetadata: (title: string) => void,
    signal: AbortSignal
) => Promise<void>;


export class MetadataService {
    private controller: AbortController | null = null;
    private sources: MetadataSource[];

    constructor(sources: MetadataSource[]) {
        this.sources = sources;
    }
    
    start(url: string, onMetadata: (title: string) => void): void {
        this.stop();
        this.controller = new AbortController();
        void this.run(url, onMetadata, this.controller.signal);
    }

    stop(): void {
        this.controller?.abort();
        this.controller = null;
    }

    private async run(
        url: string,
        onMetadata: (title: string) => void,
        signal: AbortSignal 
    ): Promise<void> {

        for (const source of this.sources) {
            if (signal.aborted) return; 

            try {
                await source(url, onMetadata, signal);
            } catch (error) {
                if (signal.aborted) return;  // stopped on purpose, not error

                console.warn("Metadata source failed, trying next.\n", error);
            }
        }
    }
}
