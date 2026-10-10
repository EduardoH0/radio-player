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

import { type SheetAction, ActionSheet } from './elements/action-sheet';


export class App {
    private readonly player: Player;
    private readonly viewManager: ViewManager;
    private readonly actionSheet: ActionSheet;

    private readonly favoritesView: StationListView;
    private readonly collectionStationsView: StationListView;
    private readonly libraryView: CollectionListView;

    private library: RadioLibrary;
    private activeStationId: string | null = null;
    private activeCollectionId: string | null = null;
    private openCollectionId: string | null = null;

    constructor() {
        this.player = new Player();
        this.viewManager = new ViewManager();
        this.actionSheet = new ActionSheet();
        this.library = loadLibrary();

        this.favoritesView = new StationListView(
            document.querySelector<HTMLDivElement>("#favorite-view-title")!,
            document.querySelector<HTMLDivElement>("#favorite-stations")!,
            station => { void this.selectStation(station); },
            station => { this.openStationMenu(station, { inCollectionId: null }) }
        );

        this.collectionStationsView = new StationListView(
            document.querySelector<HTMLDivElement>("#collection-view-title")!,
            document.querySelector<HTMLDivElement>("#collection-stations")!,
            station => { void this.selectStation(station); },
            station => { this.openStationMenu(station, { inCollectionId: this.openCollectionId }) }
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
        document.querySelector<HTMLButtonElement>("#library-view-btn")
            ?.addEventListener("click", () => { this.handleLibraryClick(); });

        document.querySelector<HTMLButtonElement>("#favorite-view-btn")
            ?.addEventListener("click", () => {
                this.activeCollectionId = null;
                this.viewManager.show("favorites");
        });
    }

    private reset(): void {
        this.activeStationId = null;
        this.activeCollectionId = null;
        this.openCollectionId = null;

        this.renderFavorites();
        this.renderLibrary();

        this.viewManager.show("favorites");
    }

    private handleLibraryClick(): void {
        if (this.viewManager.mode === "collection") {
            this.openCollectionId = null;
            this.viewManager.show("library");
        } else if (this.openCollectionId) {
            this.viewManager.show("collection");
        } else {
            this.viewManager.show("library");
        }
    }

    private renderFavorites(): void {
        this.favoritesView.render(
            this.library.getCollectionStations(FAVORITES_COLLECTION_ID),
            this.activeStationId,
            "Favorites"
        );
    }

    private renderCollection(collectionId: string): void {
        this.collectionStationsView.render(
            this.library.getCollectionStations(collectionId),
            this.activeStationId,
            this.library.getCollectionName(collectionId)
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
        this.openCollectionId = collectionId;

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

    private openStationMenu(
        station: RadioStation,
        context: { inCollectionId: string | null }
    ): void {
        const isFavorite = this.library.isFavorite(station.id); 

        const actions: SheetAction[] = [
            {
                id: "toggle-favorite",
                label: isFavorite ? "Remove from favorites" : "Add to favorites"
            },
            {
                id: "add-to-collection",
                label: "Add to collection..."
            }
        ]

        if (context.inCollectionId) {
            actions.push({
                id: "remove-from-collection",
                label: "Remove from this collection"
            });
        }

        this.actionSheet.open(actions, actionId => {
            this.handleStationAction(actionId, station, context);
        });
    }

    handleStationAction(
        actionId: string,
        station: RadioStation,
        context: { inCollectionId: string | null }    
    ): void {
        switch (actionId) {
            case "toggle-favorite":
                this.library.toggleStationFromCollection(
                    FAVORITES_COLLECTION_ID,
                    station.id
                );
                this.actionSheet.close();
                break;

            case "add-to-collection":
                this.openCollectionPicker(station);
                return;

            case "remove-from-collection":
                if (context.inCollectionId) {
                    this.library.toggleStationFromCollection(
                        context.inCollectionId,
                        station.id
                    );
                }
                this.actionSheet.close();
                break;

            default:
                this.actionSheet.close();
                return;
        }

        saveLibrary(this.library);
        this.renderFavorites();
        if (this.openCollectionId) {
            this.renderCollection(this.openCollectionId);
        }
    }

    openCollectionPicker(station: RadioStation): void {
        const actions: SheetAction[] = this.library.userCollections.map(collection => (
            {
                id: collection.id,
                label: collection.containsStation(station.id)
                    ? `✓ ${collection.name}`
                    : collection.name,
            }
        ));

        this.actionSheet.open(actions, collectionId => {
            this.library.toggleStationFromCollection(collectionId, station.id);
            saveLibrary(this.library);

            if (this.openCollectionId) {
                this.renderCollection(this.openCollectionId);
            }

            this.actionSheet.close();
        });
    }
}
