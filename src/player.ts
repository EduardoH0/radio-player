// player.ts
import Hls from "hls.js";
import type { RadioStation } from "./models/radio-station";


export type PlayerState = "idle" | "playing" | "paused";


export class Player {
    private readonly audio: HTMLAudioElement;

    private readonly titleElement: HTMLDivElement;
    private readonly subtitleElement: HTMLDivElement;
    private readonly buttonElement: HTMLButtonElement;
    private readonly buttonIconElement: HTMLImageElement;

    private hls: Hls | null = null;
    private currentStation: RadioStation | null = null;
    private state: PlayerState = "idle";

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

        this.updateUi();
    }

    public async play(station: RadioStation): Promise<void> {
        const stationChanged = this.currentStation?.id !== station.id;

        if (stationChanged) {
            this.currentStation = station;
            await this.loadStation(station);
        } else {
            await this.audio.play();
        }

        this.state = "playing";
        this.updateUi();
    }

    public pause(): void {
        this.audio.pause();

        this.state = "paused";
        this.updateUi();
    }

    public async toggle(): Promise<void> {
        if (!this.currentStation) {
            return;
        }

        if (this.state === "playing") {
            this.pause();
            return;
        }

        await this.audio.play();

        this.state = "playing";
        this.updateUi();
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

        throw new Error(
            "HLS playback is not supported by this browser.",
        );
    }

    private shouldUseNativeHls(): boolean {
        const isAppleMobileDevice =
            /iPad|iPhone|iPod/.test(navigator.userAgent);

        return (
            isAppleMobileDevice &&
            this.audio.canPlayType(
                "application/vnd.apple.mpegurl",
            ) !== ""
        );
    }

    private loadHlsWithLibrary(url: string,): Promise<void> {
        return new Promise((resolve, reject) => {
            const hls = new Hls();

            this.hls = hls;

            hls.attachMedia(this.audio);

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(url);
            });

            hls.on(
                Hls.Events.MANIFEST_PARSED,
                async () => {
                    try {
                        await this.audio.play();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                },
            );

            hls.on(Hls.Events.ERROR, (_, data) => {
                console.error("HLS error:", data);

                if (data.fatal) {
                    reject(
                        new Error(
                            `HLS error: ${data.details}`,
                        ),
                    );
                }
            });
        });
    }

    private clearSource(): void {
        this.audio.pause();

        this.hls?.destroy();
        this.hls = null;

        this.audio.removeAttribute("src");
    }

    private isHlsUrl(url: string): boolean {
        return url.toLowerCase().includes(".m3u8");
    }

    private updateUi(): void {
        this.titleElement.textContent = this.currentStation?.title ?? "...";
        this.subtitleElement.textContent =
            this.currentStation?.tags?.join(" · ") ?? "";

        const isPlaying = this.state === "playing";
        const icon = isPlaying
            ? "pause.svg"
            : "play.svg";

        this.buttonIconElement.src =
            `${import.meta.env.BASE_URL}icons/${icon}`;

        this.buttonElement.setAttribute(
            "aria-label",
            isPlaying ? "Pause" : "Play",
        );

        this.buttonElement.disabled = this.currentStation === null;
    }
}
