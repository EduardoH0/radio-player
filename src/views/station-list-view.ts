// station-list-view.ts
import type { RadioStation } from "../models/radio-station";
import { createStationElement } from "../elements/station-element";


export class StationListView {
    private readonly header: HTMLDivElement;
    private readonly container: HTMLDivElement;
    private readonly onSelect: (station: RadioStation) => void;
    private readonly onOpenActions: (station: RadioStation) => void;
    private readonly scrollRoot?: HTMLElement | null;
    private readonly onCompactTitleChange?: (title: string | null) => void;

    private currentTitle: string | null = null;

    constructor(
        header: HTMLDivElement,
        container: HTMLDivElement,
        onSelect: (station: RadioStation) => void,
        onOpenActions: (station: RadioStation) => void,
        scrollRoot?: HTMLElement | null,
        onCompactTitleChange?: (title: string | null) => void,
    ) {
        this.header = header;
        this.container = container;
        this.onSelect = onSelect;
        this.onOpenActions = onOpenActions;
        this.scrollRoot = scrollRoot;
        this.onCompactTitleChange = onCompactTitleChange;

        this.observeHeader();
    }

    render(
        stations: RadioStation[],
        activeStationId: string | null,
        collectionName: string | null
    ): void {
        this.container.replaceChildren();
        // Scroll only works when the element is visible (display != none).
        this.resetScroll();
        // Reset on render to avoid flicker with posible former currentTitle
        this.onCompactTitleChange?.(null);

        for (const station of stations) {
            const element = createStationElement(
                station,
                this.onSelect,
                this.onOpenActions
            );

            element.dataset.stationId = station.id;
            element.classList.toggle("active", station.id === activeStationId);

            this.container.appendChild(element);
        }

        this.header.textContent = collectionName;
        this.currentTitle = collectionName;
    }

    private resetScroll(): void {
        const scrollRoot = this.scrollRoot;

        if (scrollRoot != null) {
            requestAnimationFrame(() => {
                scrollRoot.scrollTop = 0;
            });
        }
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

                this.onCompactTitleChange
                    ?.(entry.isIntersecting ? null : this.currentTitle);
            },
            { root: this.scrollRoot, threshold: 0 },
        );

        observer.observe(this.header);
    }
}

export function setActiveStation(stationId: string | null): void {
    document.querySelectorAll(".station.active").forEach(station => {
        station.classList.remove("active");
    });

    if (!stationId) {
        return;
    }

    document.querySelectorAll(`[data-station-id="${stationId}"]`)
        .forEach(station => { station.classList.add("active"); });
}
