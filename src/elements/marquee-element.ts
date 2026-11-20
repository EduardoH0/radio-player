// marquee-element.ts
const SPEED = 20;  // px per second
const PAUSE_MS = 3000;  // hold before moving
const FADE_PX = 16;  // max fade width
const GAP_PX = 20;  // gap between title and duplicated
const BEZIER = [0.42, 0, 0.58, 1];
const EASING = `cubic-bezier(${BEZIER.join(", ")})`;
const FADE_STEPS = 24;  // number of samples of bezier

function easingPoint(s: number): { x: number; y: number} {
    const [x1, y1, x2, y2] = BEZIER;
    const u = 1 - s;
    return {
        x: 3 * u * u * s * x1 + 3 * u * s * s * x2 + s ** 3,
        y: 3 * u * u * s * y1 + 3 * u * s * s * y2 + s ** 3,
    };
}

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
        const moveMs = (shift / SPEED) * 1000;
        const total = moveMs + PAUSE_MS;
        const t1 = PAUSE_MS / total;  // move starts here
        const options = { duration: total, iterations: Infinity };

        // Text movement
        for (const el of [this.text, this.clone]) {
            this.animations.push(
                el.animate(
                    [
                        { transform: "translateX(0)", offset: 0 },
                        { transform: "translateX(0)", offset: t1, easing: EASING },
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
        for (let i = 1; i <= FADE_STEPS; i++) {
            const { x, y } = easingPoint(i / FADE_STEPS);
            const travelled = y * shift;
            const remaining = shift - travelled;
            // Width of fade-left can never be > than `remaining`
            frames.push({
                "--fade-left": `${Math.min(FADE_PX, travelled, remaining)}px`,
                offset: Math.min(1, t1 + x * (1 - t1)),
            });
        }
        this.animations.push(this.container.animate(frames, options));
    }
}
