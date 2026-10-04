import { Player } from './player';
import {
    ALL_STATIONS_COLLECTION_ID,
    FAVORITES_COLLECTION_ID,
    RadioLibrary
} from './models/radio-library';
import type { RadioStation } from './models/radio-station';
import type { Collection } from './models/radio-collection';
import { createStationElement } from './elements/station-element';
import { createCollectionElement } from './elements/collection-element';
import { importLibrary } from './services/library-file';
import { loadLibrary, saveLibrary } from './services/storage';

type ViewMode = "favorites" | "library" | "collection";

export class App {
    private readonly player: Player;
    private library: RadioLibrary;

    private viewMode: ViewMode = "favorites";
    private activeStationId: string | null = null;
    private activeCollectionId: string | null = null;
    private openCollection: boolean = false;

    constructor() {
        this.player = new Player();
        this.library = loadLibrary();

        this.addEventListeners();
        this.reset();
    }

    private reset(): void {
        this.activeStationId = null;
        this.activeCollectionId = null;
        this.openCollection = false;

        this.renderFavorites();
        this.renderLibrary();
        this.clearCollectionView();
        this.showView("favorites");
    }

    private addEventListeners(): void {
        const importButton =
            document.querySelector(
                "#import-library-btn"
            );

        const fileInput =
            document.querySelector(
                "#import-file"
            )!;

        importButton?.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", async () => {
            const file = fileInput.files?.[0];

            if (!file) {
                return;
            }

            this.library = await importLibrary(file);
            saveLibrary(this.library);
            this.reset();
        });

        const libraryButton =
            document.querySelector(
                "#my-library-btn"
            );

        libraryButton?.addEventListener("click", () => {
            this.handleLibraryClick();
        });

        const myFavoritesButton =
            document.querySelector(
                "#my-favorites-btn"
            );

        myFavoritesButton?.addEventListener("click", () => {
            this.showView("favorites");
            this.activeCollectionId = null;
        });
    }

    private handleLibraryClick(): void {
        if (this.viewMode === "collection") {
            this.openCollection = false;
            this.showView("library");
        } else if (this.openCollection) {
            this.showView("collection");
        } else {
            this.showView("library");
        }
    }

    private renderFavorites(): void {
        const stations = this.library.getCollectionStations(
            FAVORITES_COLLECTION_ID
        );

        this.renderStationElements("#favorite-stations", stations);
    }

    private renderLibrary(): void {
        const userCollections = this.library.userCollections;

        const allCollections: Collection[] = [
            {
                id: ALL_STATIONS_COLLECTION_ID,
                name: "All stations"
            },
            ...userCollections
        ];

        this.renderCollectionElements("#collections", allCollections);
    }

    private renderCollection(collectionId: string): void {
        const stations = this.library.getCollectionStations(
            collectionId
        );

        this.renderStationElements("#collection-stations", stations);
    }

    private renderStationElements(
        containerSelector: string,
        stations: RadioStation[]
    ): void {
        const container = document.querySelector(
            containerSelector
        );

        if (!container) {
            return;
        }

        container.replaceChildren();

        for (const station of stations) {
            const stationElement = createStationElement(
                station,
                clickedStation => {
                    void this.selectStation(clickedStation);
                },
            );

            stationElement.dataset.stationId = station.id;

            if (station.id === this.activeStationId) {
                stationElement.classList.add("active");
            }

            container.appendChild(stationElement);
        }
    }

    private renderCollectionElements(
        containerSelector: string,
        collections: Collection[]
    ): void {
        const container = document.querySelector(
            containerSelector
        );

        if (!container) {
            return;
        }

        container.replaceChildren();

        for (const collection of collections) {
            const collectionElement = createCollectionElement(
                collection,
                clickedCollection => {
                    void this.selectCollection(clickedCollection);
                },
            );

            collectionElement.dataset.collectionId = collection.id;

            container.append(collectionElement);
        }
    }

    private async selectStation(
        station: RadioStation
    ): Promise<void> {
        try {
            this.activeStationId = station.id;

            this.updateStationHighlight();
            this.updateCollectionHighlight();

            await this.player.play(station);
        } catch (error) {
            console.error(
                `Could not play "${station.title}"`,
                error
            );
        }
    }

    private async selectCollection(
        collectionId: string
    ): Promise<void> {
        this.openCollection = true;

        this.renderCollection(collectionId);
        this.showView("collection");

        // Scroll only works when the element is visible (display != none).
        if (this.activeCollectionId !== collectionId) {
            requestAnimationFrame(() => {
                document.querySelector("#collection-view")!.scrollTop = 0;
            });
        }

        this.activeCollectionId = collectionId;
    }

    private showView(viewMode: ViewMode): void {
        if (this.viewMode === viewMode) {
            return;
        }

        this.viewMode = viewMode;

        const viewSelectors: Record<ViewMode, string> = {
            favorites: "#favorite-view",
            library: "#library-view",
            collection: "#collection-view"
        };

        document.querySelectorAll(".view.active").forEach(view => {
            view.classList.remove("active");
        });

        document.querySelector(viewSelectors[viewMode])
            ?.classList.add("active");
    }

    private clearCollectionView(): void {
        // No need for now.
    }

    private updateStationHighlight(): void {
        document.querySelectorAll(".station.active").forEach(station => {
            station.classList.remove("active");
        });

        if (!this.activeStationId) {
            return;
        }

        document.querySelectorAll(
            `[data-station-id="${this.activeStationId}"]`
        ).forEach(station => {
            station.classList.add("active");
        });
    }

    private updateCollectionHighlight(): void {
        document
            .querySelector(".collection.active")
            ?.classList.remove("active");

        if (!this.activeCollectionId) {
            return;
        }

        document.querySelector(
            `[data-collection-id="${this.activeCollectionId}"]`
        )?.classList.add("active");
    }
}
