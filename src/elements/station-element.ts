// station-element.ts
import type { RadioStation } from "../models/radio-station";


export function createStationElement(
    station: RadioStation,
    onSelect: (station: RadioStation) => void,
    onOpenActions: (station: RadioStation) => void,
): HTMLDivElement {

    const element = document.createElement("div");
    element.className = "station";
    element.tabIndex = 0;

    element.innerHTML = `
        <div class="station-left">
            <svg viewBox="0 0 512 512"><path d="m96 448 320-192L96 64z"/></svg>
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
                <span class="station-tags">
                    ${station.tags?.join(" · ") ?? ""}
                </span>
                
                <button class="station-actions-trigger">
                    ...
                </button>
            </div>
    `;

    element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(station);
        }
    });

    element.addEventListener(
        "click",
        () => { onSelect(station); }
    );

    element.querySelector<HTMLButtonElement>(".station-actions-trigger")
        ?.addEventListener("click", event => {
            event.stopPropagation();
            onOpenActions(station);
    });

    return element;
}
