// history-view.ts
import type { HistoryEntry } from "../models/history-entry";
import { createHistoryEntryElement } from "../elements/history-entry-element";


export class HistoryView {
    private readonly header: HTMLDivElement;
    private readonly container: HTMLDivElement;
    private readonly scrollRoot?: HTMLElement | null;
    private readonly onCompactTitleChange?: () => void;

    private headerString: string = "History";
    private scrolledPast: boolean = false;
    private query: string = "";

    constructor(
        header: HTMLDivElement,
        container: HTMLDivElement,
        scrollRoot?: HTMLElement | null,
        onCompactTitleChange?: () => void,
    ) {
        this.header = header;
        this.container = container;
        this.scrollRoot = scrollRoot;
        this.onCompactTitleChange = onCompactTitleChange;

        this.observeHeader();
    }

    render(entries: HistoryEntry[]): void {
        this.container.replaceChildren();
        this.onCompactTitleChange?.();

        for (const entry of entries) {
            const element = createHistoryEntryElement(entry);
            this.container.appendChild(element);
        }
        this.filter(this.query);
    }

    prepend(entry: HistoryEntry): void {
        const element = createHistoryEntryElement(entry);
        this.container.prepend(element);
    }

    get compactTitle(): string | null {
        return this.scrolledPast ? this.headerString : null;
    }

    private observeHeader(): void {
        if (!this.scrollRoot || !this.onCompactTitleChange) {
            return;
        }

        const scrollRoot = this.scrollRoot;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Do not let observer run callback if container's display == none
                if (scrollRoot.getClientRects().length === 0) return;
                
                this.scrolledPast = !entry.isIntersecting;

                this.onCompactTitleChange?.()
            },
            { root: this.scrollRoot, threshold: 0 },
        );

        observer.observe(this.header);
    }

    filter(query: string): void {
        this.query = query.trim().toLowerCase();
        const tokens = this.query.split(/\s+/).filter(Boolean);

        this.container.querySelectorAll<HTMLElement>(".history-entry").forEach(el => {
            const words = (el.dataset.search ?? "").split(/\s+/);

            el.hidden = !tokens.every(token =>
                words.some(word => word.startsWith(token))
            );
        });
    }
}
