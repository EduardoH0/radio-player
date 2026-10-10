// station-list-view.ts
import type { RadioStation } from "../models/radio-station";
import { createStationElement } from "../elements/station-element";


export class StationListView {
    private readonly header: HTMLDivElement;
    private readonly container: HTMLDivElement;
    private readonly onSelect: (station: RadioStation) => void;
    private readonly onOpenActions: (station: RadioStation) => void;

    constructor(
        header: HTMLDivElement,
        container: HTMLDivElement,
        onSelect: (station: RadioStation) => void,
        onOpenActions: (station: RadioStation) => void
    ) {
        this.header = header;
        this.container = container;
        this.onSelect = onSelect;
        this.onOpenActions = onOpenActions;
    }

    render(
        stations: RadioStation[],
        activeStationId: string | null,
        collectionName: string | null
    ): void {
        this.container.replaceChildren();

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
