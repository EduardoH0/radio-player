// station-element.ts
import type { RadioStation } from "../models/radio-station";


type StationClickHandler = (
    station: RadioStation,
    element: HTMLDivElement
) => void;

export function createStationElement(
    station: RadioStation,
    onClick: StationClickHandler,
): HTMLDivElement {

    const element = document.createElement("div");
    element.className = "station";
    element.tabIndex = 0;

    element.innerHTML = `
        <div class="station-left">
            <svg viewBox="0 0 512 512" class="ionicon"><path d="m96 448 320-192L96 64z"/></svg>
        </div>

        <div class="station-content">
            
            <div class="station-row-1">
                <span class="station-title">
                    ${station.title}
                </span>

                <span class="station-secondary">
                    ${station.country? station.country : ""}
                </span>
            </div>

            <div class="station-row-2">
                ${station.tags?.join(" · ") ?? ""}
            </div>
    `;

    element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick(station, element);
        }
    });

    element.addEventListener(
        "click",
        () => { onClick(station, element); }
    );

    return element;
}
