// player.ts
/**
*
* NOTE: (tested on iPhone)
* Safari does not report the failure of a broken .mp3 stream link. 
* It sits in `stalled` audio event, `this.audio.networkState = 2 (still trying) until the
* load timeout fires (on `LOAD_TIMEOUT_MS`).
* A workaround could be handling `stalled` event myself, with a short watchdog,
* since `stalled` event can be legitimate on a slow connection.
*
* e.g.:
* ```ts
*   this.audio.addEventListener("stalled", () => {
*   // create stall timer
*   }
*
*   for (const ev of ["playing", "canplay", "loadeddata"]) {
*      this.audio.addEventListener(ev, () => {
*      // clear stall timer
*   }
*/
import Hls from "hls.js";
import type { RadioStation } from "./models/radio-station";

export type PlayerState = "idle" | "loading" | "playing" | "paused";

const LOAD_TIMEOUT_MS = 15000;


export class Player {
    private readonly audio: HTMLAudioElement;

    private readonly titleElement: HTMLDivElement;
    private readonly subtitleElement: HTMLDivElement;
    private readonly buttonElement: HTMLButtonElement;
    private readonly buttonIconElement: HTMLImageElement;

    private hls: Hls | null = null;
    private currentStation: RadioStation | null = null;
    private state: PlayerState = "idle";

    /* Incremented to invalidate any in-flight load. */
    private requestId = 0;

    public constructor() {
        this.audio = new Audio();

        this.titleElement =
            document.querySelector<HTMLDivElement>("#player-title")!;
        this.subtitleElement =
            document.querySelector<HTMLDivElement>("#player-sub-title")!;
        this.buttonElement =
            document.querySelector<HTMLButtonElement>("#player-btn")!;
        this.buttonIconElement =
            document.querySelector<HTMLImageElement>("#player-btn-icon")!;

        this.buttonElement.addEventListener("click", () => {
            void this.toggle();
        });

        // Failures that happen while loading (corrupt file) or after playback started.
        this.audio.addEventListener("error", () => {
            if (this.state === "loading" || this.state === "playing") {
                console.error("Audio error:", this.audio.error);
                this.halt();
            }
        });

        // Stream ended or the OS paused it (call...)
        const onStopped = () => {
            if (this.state === "playing") {
                this.halt();
            }
        }
        this.audio.addEventListener("ended", onStopped);
        this.audio.addEventListener("pause", onStopped);

        this.updateUi();
    }

    public async play(station: RadioStation): Promise<void> {
        const id = ++this.requestId;

        this.currentStation = station;
        this.state = "loading";
        this.updateUi();

        try {
            await this.withTimeout(this.loadStation(station), LOAD_TIMEOUT_MS);
            if (id !== this.requestId) return;  // superseded or cancelled
            this.state = "playing";
        } catch (error) {
            if (id !== this.requestId) return; // stale, ignore (e.g. AbortError)
            console.log(`Error loading station: ${error}`);
            this.clearSource();
            this.state = "paused";
        }
        
        this.updateUi();
    }

    public pause(): void {
        this.halt();
    }

    public reset(): void {
        this.requestId++;
        this.clearSource();
        this.currentStation = null;

        this.state = "idle";
        this.updateUi();
    }

    public async toggle(): Promise<void> {
        if (!this.currentStation) {
            return;
        }

        // Tapping while loading cancels the load.
        if (this.state === "playing" || this.state === "loading") {
            this.pause();
            return;
        }

        await this.play(this.currentStation);
    }
    
    /** Cancels any pending load, releases the stream and shows "paused". */
    private halt(): void {
        this.requestId++;
        this.clearSource();
        this.state = "paused";
        this.updateUi();
    }

    private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const time = window.setTimeout(
                () => reject(new Error("Timed out loading station")),
                ms
            );
            promise
                .then(resolve, reject)
                .finally(() => window.clearTimeout(time));
        });
    }

    private async loadStation(station: RadioStation): Promise<void> {
        this.clearSource();

        if (this.isHlsUrl(station.url)) {
            await this.loadHls(station.url);
            return;
        }

        this.audio.src = station.url;
        await this.audio.play();
    }

    private async loadHls(url: string): Promise<void> {
        if (this.shouldUseNativeHls()) {
            this.audio.src = url;
            await this.audio.play();
            return;
        }

        if (Hls.isSupported()) {
            await this.loadHlsWithLibrary(url);
            return;
        }

        // Returns "probably", "maybe", or ""
        // Does not reliably indicate actual HLS support.
        // Browser detection through userAgent is a better strategy.
        if (this.audio.canPlayType("application/vnd.apple.mpegurl",)) {
            this.audio.src = url;
            await this.audio.play();
            return;
        }

        throw new Error("HLS playback is not supported by this browser.");
    }

    private shouldUseNativeHls(): boolean {
        const isAppleMobileDevice =
            /iPad|iPhone|iPod/.test(navigator.userAgent);

        return (
            isAppleMobileDevice &&
            this.audio.canPlayType("application/vnd.apple.mpegurl") !== ""
        );
    }

    private loadHlsWithLibrary(url: string,): Promise<void> {
        return new Promise((resolve, reject) => {
            const hls = new Hls();
            let settled = false;

            this.hls = hls;
            hls.attachMedia(this.audio);

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(url);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, async () => {
                try {
                    await this.audio.play();
                    settled = true;
                    resolve();
                } catch (error) {
                    settled = true;
                    reject(error);
                }
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                console.error("HLS error:", data);
                if (!data.fatal) return;

                if (!settled) {
                    settled = true;
                    reject(new Error(`HLS error: ${data.details}`));
                } else {
                    // Died after playback had already started.
                    // Promise would have resolved already, so we have to handle the reset manually.
                    this.halt();
                }
            });
        });
    }

    private clearSource(): void {
        this.hls?.destroy();
        this.hls = null;

        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load(); // actually aborts the request and rejects a pending play()
    }

    private isHlsUrl(url: string): boolean {
        return url.toLowerCase().includes(".m3u8");
    }

    private updateUi(): void {
        this.titleElement.textContent = this.currentStation?.title ?? "...";
        this.subtitleElement.textContent =
            this.currentStation?.tags?.join(" · ") ?? "";

        let icon: string;
        switch (this.state) {
            case "playing":
                icon = "pause.svg";
                break;
            case "paused":
                icon = "play.svg";
                break;
            case "loading":
                icon = "radio-van.svg";
                break;
            default:
                icon = "";
                break;
        }

        this.buttonIconElement.src = `${import.meta.env.BASE_URL}icons/${icon}`;

        this.buttonElement.disabled = this.currentStation === null;
        this.buttonElement.dataset.state = this.state;
    }
}
