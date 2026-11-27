// media-session.ts
import type { RadioStation } from "../models/radio-station";
import type { PlayerState } from "../player";

type Handlers = {
    play: () => void;
    stop: () => void;
    next?: () => void;
    previous?: () => void;
}

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const ARTWORK: MediaImage[] = [192, 512].map((size) => ({
    src: `${import.meta.env.BASE_URL}icons/icon-${size}.png`,
    sizes: `${size}x${size}`,
    type: "image/png"
}));


export class MediaSessionService {
    private handlers: Handlers | null = null;

    constructor() {
        // Safari 17+: treat the page as a media player, so iOS keeps the
        // lockscreen session alive on the first pause.
        const nav = navigator as AudioSessionNavigator;
        if (nav.audioSession) nav.audioSession.type = "playback";
    }

    static isSupported(): boolean {
        return "mediaSession" in navigator;
    }

    setHandlers(handlers: Handlers): void {
        this.handlers = handlers;
    }
    
    /**
    * Call once audio is actually playing. iOS ignores handlers registered
    * before playback (and shows ±10s seek buttons instead of next/previous).
    */
    activate(): void {
        const handlers = this.handlers;
        if (!handlers) return;
        this.trySet("play", handlers.play);
        this.trySet("pause", handlers.stop);
        this.trySet("stop", handlers.stop);
        // Registering this makes iOS hide ±10s buttons  
        this.trySet("nexttrack", handlers.next ?? null);
        this.trySet("previoustrack", handlers.previous ?? null);
        // Live stream: no seeking
        this.trySet("seekbackward", null);
        this.trySet("seekforward", null);
        this.trySet("seekto", null);
    }

    setNowPlaying(station: RadioStation, title: string | null): void {
        const ms = navigator.mediaSession;
        // Created once and mutated afterwards: a new MediaMetadata makes
        // the OS reload the artwork
        ms.metadata ??= new MediaMetadata({ artwork: ARTWORK });

        const nextTitle = title ?? station.title;
        const nextArtist = title ? station.title : (station.tags?.join(" · ") ?? "");
        if (ms.metadata.title !== nextTitle) ms.metadata.title = nextTitle;
        if (ms.metadata.artist !== nextArtist) ms.metadata.artist = nextArtist;
    }

    setState(state: PlayerState): void {
        const ms = navigator.mediaSession;
        // MediaSessionPlaybackState can be "playing", "paused", "none"
        ms.playbackState =
            state === "playing" || state === "loading" ? "playing"
            : state === "stopped" ? "paused"
            : "none";
        if (state === "playing") {
            // Live: no progress bar.
            // hls.js sets a finite MediaSource duration (the size of the live window)
            // and only later switches to Infinity. This tries forcing not to show a
            // progress bar during that finite window.
            // Tested ok on Chrome, Safari throws on Infinity ("non-finite")
            try { ms.setPositionState({ duration: Infinity }); } catch { /* unsupported */ }
        }
    }

    clear(): void {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
    }

    private trySet(
        action: MediaSessionAction,
        handler: MediaSessionActionHandler | null
    ): void {
        try {
            navigator.mediaSession.setActionHandler(action, handler); 
        } catch {
            /* unsupported action */ 
        }
    }
}
