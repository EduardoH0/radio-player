import { createStationElement } from './elements/station-element';
import { createLibrary, type RadioLibrary } from './models/radio-library'
import type { RadioStation } from './models/radio-station';
import { Player } from './player';
import { loadLibrary, saveLibrary } from './services/storage'
import { importLibrary } from './services/library-file';


export class App {
    private player: Player;
    private library: RadioLibrary;
    private activeStationElement: HTMLDivElement | null = null;

    constructor() {
        this.player = new Player();
        this.library = loadLibrary() ?? createLibrary();

        this.addEventListeners();
    }

    private addEventListeners(): void {
        const importButton = document.querySelector<HTMLButtonElement>("#import-library-btn");
        const fileInput = document.querySelector<HTMLInputElement>("#import-file")!;

        importButton?.addEventListener("click", () => { fileInput.click(); });

        fileInput.addEventListener("change", async () => {
            const file = fileInput.files?.[0];
            if (!file) return;

            this.library = await importLibrary(file);

            saveLibrary(this.library);

            this.render();
        });
    }

    public render(): void {
        const stations = document.querySelector<HTMLDivElement>("#stations");

        stations?.replaceChildren();

        for (const station of this.library.stations) {
            
            stations?.appendChild(
                createStationElement(
                    station,
                    (clickedStation, clickedElement) => {
                        void this.selectStation(
                            clickedStation,
                            clickedElement
                        );
                    },
                )
            );
        }
    }

    private async selectStation(
        station: RadioStation,
        element: HTMLDivElement
    ): Promise<void> {
        try {
            await this.player.play(station);

            this.activeStationElement?.classList.remove('active');
            element.classList.add('active');
            this.activeStationElement = element;

        } catch (error) {
            console.error(`Could not play "${station.title}"`, error)
        }
    }
}
