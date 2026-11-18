// marquee-element.ts
const SPEED = 20;  // px per second
const PAUSE_MS = 2000;  // hold at each end
const FADE_PX = 16;  // max fade width
const FADE_MS = 800;  // time for a fade to grow or shrink
const EASING = "cubic-bezier(0.42, 0, 0.58, 1)";


export class MarqueeElement {
    private readonly container: HTMLElement;
    private readonly text: HTMLElement;
    private readonly resizeObserver: ResizeObserver;
    private animations: Animation[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.text = container.querySelector("span")!;

        this.resizeObserver = new ResizeObserver(() => this.update());
        this.resizeObserver.observe(container);
    }

    setText(value: string): void {
        this.text.textContent = value;
        this.update();
    }

    private update(): void {
        this.animations.forEach((a) => a.cancel());
        this.animations = [];

        const distance = this.text.offsetWidth - this.container.clientWidth;
        if (distance <= 0) return;

        const moveMs = (distance / SPEED) * 1000;
        const total = 2 * moveMs + 2 * PAUSE_MS;
        const fadeMs = Math.min(FADE_MS, moveMs / 2);

        // Timeline points as fractions of the cycle
        const t1 = PAUSE_MS / total;
        const t2 = (PAUSE_MS + moveMs) / total
        const t3 = (2 * PAUSE_MS + moveMs) / total;
        const f = fadeMs / total;

        const options = { duration: total, iterations: Infinity };

        // Text movement
        this.animations.push(
            this.text.animate(
                [
                    { transform: "translateX(0)", offset: 0 },
                    { transform: "translateX(0)", offset: t1, easing: EASING },
                    { transform: `translateX(-${distance}px)`, offset: t2 },
                    { transform: `translateX(-${distance}px)`, offset: t3, easing: EASING },
                    { transform: "translateX(0)", offset: 1 }
                ],
                options
            )
        );

        // Fades: left appears as soon as it moves, right disappears as it arrives
        const px = `${FADE_PX}px`;
        const fade = (offset: number, left: string, right: string) => ({
            offset,
            "--fade-left": left,
            "--fade-right": right,
        });

        this.animations.push(
            this.container.animate(
                [
                    fade(0,      "0px", px),
                    fade(t1,     "0px", px),
                    fade(t1 + f, px,    px),
                    fade(t2 - f, px,    px),
                    fade(t2,     px,    "0px"),
                    fade(t3,     px,    "0px"),
                    fade(t3 + f, px,    px),
                    fade(1 - f,  px,    px),
                    fade(1,      "0px", px),
                ],
                options
            )
        );
    }
}
