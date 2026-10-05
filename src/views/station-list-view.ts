// station-list-view.ts
import type { RadioStation } from "../models/radio-station";
import { createStationElement } from "../elements/station-element";


export class StationListView {
    private readonly container: HTMLDivElement;
    private readonly onSelect: (station: RadioStation) => void;

    constructor(container: HTMLDivElement, onSelect: (station: RadioStation) => void) {
        this.container = container;
        this.onSelect = onSelect;
    }

    render(stations: RadioStation[], activeStationId: string | null): void {
        this.container.replaceChildren();

        for (const station of stations) {
            const element = createStationElement(
                station,
                this.onSelect
            );

            element.dataset.stationId = station.id;
            element.classList.toggle("active", station.id === activeStationId);

            this.container.appendChild(element);
        }
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
