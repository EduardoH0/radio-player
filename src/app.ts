import { createStationElement } from './elements/station-element';
import { createLibrary, type RadioLibrary } from './models/radio-library'
import type { RadioStation } from './models/radio-station';
import { Player } from './player';
import { loadLibrary, saveLibrary } from './services/storage'


export class App {
    private player: Player;
    private library: RadioLibrary;
    private activeStationElement: HTMLDivElement | null = null;

    constructor() {
        this.player = new Player();
        this.library = loadLibrary() ?? createLibrary();

        if (this.library.stations.length === 0) {
            this.library.stations.push({
                id: "cadena-ser-radio",
                title: "Cadena SER",
                url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASERAAC.m3u8",
                country: "ES",
                tags: ["News", "Talk"]
            });
            this.library.stations.push({
                id: "radio-rne1",
                title: "Radio Nacional (rne1)",
                url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r1_main.m3u8",
                country: "ES",
                tags: ["News", "Talk"]
            });
            this.library.stations.push({
                id: "radio-rne2",
                title: "Radio Clasica (rne2)",
                url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r2_main.m3u8",
                country: "ES",
                tags: ["Classical"]
            });
            this.library.stations.push({
                id: "lot-radio",
                title: "The Lot Radio",
                url: "https://livepeercdn.studio/hls/85c28sa2o8wppm58/index.m3u8",
                country: "US",
                tags: ["Electronic", "Techno"]
            });
            this.library.stations.push({
                id: "kiosk-radio",
                title: "Kiosk Radio",
                url: "https://play.streamnerd.nl/kioskradio/kioskradio/playlist.m3u8",
                country: "BE",
                tags: ["Electronic", "Techno"]
            });
        }
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
