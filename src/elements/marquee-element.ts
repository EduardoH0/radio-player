// marquee-element.ts
const SPEED = 30;  // px per second
const PAUSE_MS = 3000;  // hold before moving
const RAMP_MS = 3000;  // time to reach/leave full speed
const FADE_PX = 16;  // max fade width
const GAP_PX = 20;  // gap between title and duplicated
const EASE_IN = "cubic-bezier(0.3333, 0, 0.6667, 0.3333)";  // y = x²
const EASE_OUT = "cubic-bezier(0.3333, 0.6667, 0.6667, 1)";  // y = 1-(1-x)²
const FADE_STEPS = 24;  // number of samples of bezier


export class MarqueeElement {
    private readonly container: HTMLElement;
    private readonly text: HTMLElement;
    private readonly clone: HTMLElement;
    private readonly resizeObserver: ResizeObserver;
    private animations: Animation[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.container.style.display = "flex";
        this.container.style.gap = `${GAP_PX}px`;
        this.text = container.querySelector("span")!;

        this.clone = document.createElement("span");
        this.clone.style.display = "none";
        container.appendChild(this.clone);

        this.resizeObserver = new ResizeObserver(() => this.update());
        this.resizeObserver.observe(container);
    }

    setText(value: string): void {
        this.text.textContent = value;
        this.clone.textContent = value;
        this.update();
    }

    getText(): string {
        return this.text.textContent;
    }

    private update(): void {
        this.animations.forEach((a) => a.cancel());
        this.animations = [];

        const overflowing = this.text.offsetWidth > this.container.clientWidth;
        this.clone.style.display = overflowing ? "" : "none";
        this.container.style.setProperty(
            "--fade-right",
            overflowing ? `${FADE_PX}px`: "0px"
        );
        if (!overflowing) return;

        const shift = this.text.offsetWidth + GAP_PX;
        const rampMs = Math.min(RAMP_MS, (shift / SPEED) * 1000);
        // 0.5 (avg) since velocity climbs linearly from 0 to `SPEED`
        const rampPx = 0.5 * SPEED * rampMs / 1000;
        const cruiseMs = ((shift - 2 * rampPx) / SPEED) * 1000;
        const moveMs = cruiseMs + 2 * rampMs;
        const total = moveMs + PAUSE_MS;
        const t1 = PAUSE_MS / total;  // accel starts
        const t2 = (PAUSE_MS + rampMs) / total;  // cruise starts
        const t3 = (PAUSE_MS + moveMs - rampMs) / total;  // decel starts
        const options = { duration: total, iterations: Infinity };

        // Text movement
        for (const el of [this.text, this.clone]) {
            this.animations.push(
                el.animate(
                    [
                        { transform: "translateX(0)", offset: 0 },
                        { transform: "translateX(0)", offset: t1, easing: EASE_IN},
                        { transform: `translateX(-${rampPx}px)`, offset: t2, easing: "linear" },
                        { transform: `translateX(-${shift - rampPx}px)`, offset: t3, easing: EASE_OUT },
                        { transform: `translateX(-${shift}px)`, offset: 1 },
                    ],
                    options
                )
            );
        }

        // Left fade sampled along the easing curve
        const frames: Keyframe[] = [
            { "--fade-left": "0px", offset: 0 },
            { "--fade-left": "0px", offset: t1},
        ]

        const pos = (ms: number): number => {  // ms since move started
            // Accel: velocity grows linearly 0 -> SPEED so distance grows t²
            if (ms < rampMs) {
                return rampPx * (ms / rampMs) ** 2;
            }
            // Decel: accel ramp mirrored
            if (ms > moveMs - rampMs) {
                return shift - rampPx * ((moveMs - ms) / rampMs) ** 2;
            }
            // Cruise: constant speed
            return rampPx + (ms - rampMs) * SPEED / 1000;
        };

        // Sample only the 2 ramps. During the cruise, the fade sits at `FADE_PX`,
        // and the browser interpolates between the end of the first ramp and
        // the start of the second.
        for (const [from, to] of [[0, rampMs], [moveMs - rampMs, moveMs]]) {
            for (let i = 0; i <= FADE_STEPS; i++) {
                const ms = from + (i / FADE_STEPS) * (to - from);
                const travelled = pos(ms);
                frames.push({
                    "--fade-left": `${Math.min(FADE_PX, travelled ** 3, shift - travelled)}px`,
                    offset: Math.min(1, (PAUSE_MS + ms) / total),
                });
            }
        }
        this.animations.push(this.container.animate(frames, options));
    }
}
