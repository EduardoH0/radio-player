import { Player } from './player';

import {
    ALL_STATIONS_COLLECTION_ID,
    FAVORITES_COLLECTION_ID,
    RadioLibrary
} from './models/radio-library';
import type { RadioStation } from './models/radio-station';
import type { Collection } from './models/radio-collection';

import { attachImportControl } from './services/import-control';
import { loadLibrary, saveLibrary } from './services/storage';

import { ViewManager } from './views/view-manager';
import { StationListView, setActiveStation } from './views/station-list-view';
import { CollectionListView, setActiveCollection } from './views/collection-list-view';


export class App {
    private readonly player: Player;
    private readonly viewManager: ViewManager;

    private readonly favoritesView: StationListView;
    private readonly collectionStationsView: StationListView;
    private readonly libraryView: CollectionListView;

    private library: RadioLibrary;
    private activeStationId: string | null = null;
    private activeCollectionId: string | null = null;
    private openCollection: boolean = false;

    constructor() {
        this.player = new Player();
        this.viewManager = new ViewManager();
        this.library = loadLibrary();

        this.favoritesView = new StationListView(
            document.querySelector<HTMLDivElement>("#favorite-stations")!,
            station => { void this.selectStation(station); }
        );

        this.collectionStationsView = new StationListView(
            document.querySelector<HTMLDivElement>("#collection-stations")!,
            station => { void this.selectStation(station); }
        );

        this.libraryView = new CollectionListView(
            document.querySelector<HTMLDivElement>("#collections")!,
            collectionId => { void this.selectCollection(collectionId); } 
        );

        this.attachNavigation();

        attachImportControl(library => {
            this.library = library;
            saveLibrary(this.library);
            this.reset();
        });

        this.reset();
    }

    private attachNavigation():void {
        document.querySelector<HTMLButtonElement>("#my-library-btn")
            ?.addEventListener("click", () => { this.handleLibraryClick(); });

        document.querySelector<HTMLButtonElement>("#my-favorites-btn")
            ?.addEventListener("click", () => {
                this.activeCollectionId = null;
                this.viewManager.show("favorites");
        });
    }

    private reset(): void {
        this.activeStationId = null;
        this.activeCollectionId = null;
        this.openCollection = false;

        this.renderFavorites();
        this.renderLibrary();

        this.viewManager.show("favorites");
    }

    private handleLibraryClick(): void {
        if (this.viewManager.mode === "collection") {
            this.openCollection = false;
            this.viewManager.show("library");
        } else if (this.openCollection) {
            this.viewManager.show("collection");
        } else {
            this.viewManager.show("library");
        }
    }

    private renderFavorites(): void {
        this.favoritesView.render(
            this.library.getCollectionStations(FAVORITES_COLLECTION_ID),
            this.activeStationId,
        );
    }

    private renderCollection(collectionId: string): void {
        this.collectionStationsView.render(
            this.library.getCollectionStations(collectionId),
            this.activeStationId
        );
    }

    private renderLibrary(): void {
        const allCollections: Collection[] = [
            { id: ALL_STATIONS_COLLECTION_ID, name: "All stations" },
            ...this.library.userCollections,
        ];
        this.libraryView.render(allCollections);
    }

    private async selectStation(station: RadioStation): Promise<void> {
        try {
            this.activeStationId = station.id;
            setActiveStation(station.id);
            setActiveCollection(this.activeCollectionId);

            await this.player.play(station);
        } catch (error) {
            console.error(`Could not play "${station.title}"`, error);
        }
    }

    private async selectCollection(collectionId: string): Promise<void> {
        this.openCollection = true;

        this.renderCollection(collectionId);
        this.viewManager.show("collection");

        // Scroll only works when the element is visible (display != none).
        if (this.activeCollectionId !== collectionId) {
            requestAnimationFrame(() => {
                document.querySelector("#collection-view")!.scrollTop = 0;
            });
        }

        this.activeCollectionId = collectionId;
    }
}
