// radio-library.ts
import type { RadioStation } from "./radio-station";
import { RadioCollection } from "./radio-collection";

export const ALL_STATIONS_COLLECTION_ID = "all-stations";
export const FAVORITES_COLLECTION_ID = "favorites";


export class RadioLibrary {
    public readonly stations: RadioStation[];
    public readonly collections: RadioCollection[];

    private readonly stationsById: Map<string, RadioStation>;

    constructor(
        stations: RadioStation[],
        collections: RadioCollection[] = []
    ) {
        this.stations = stations;
        this.collections = collections;

        this.stationsById = new Map(
            stations.map(station => [station.id, station])
        )
    }

    get favorites(): RadioCollection {
        return this.getCollection(FAVORITES_COLLECTION_ID)!;
    }

    get userCollections(): RadioCollection[] {
        return this.collections.filter(
            collection => collection.id !== FAVORITES_COLLECTION_ID
        );
    }

    getCollection(id: string): RadioCollection | undefined {
        return this.collections.find(
            collection => collection.id === id
        );
    }

    getCollectionStations(collectionId: string): RadioStation[] {
        if (collectionId === ALL_STATIONS_COLLECTION_ID) {
            return this.stations;
        }

        const collection = this.getCollection(collectionId);

        if (!collection) {
            return [];
        }

        return collection.stationIds
            .map(id => this.stationsById.get(id))
            .filter((station): station is RadioStation => station !== undefined);
    }

    createCollection(name: string): RadioCollection {
        const normalizedName = name.trim();
        
        const collectionName = normalizedName ||
            `Collection #${this.collections.length.toString()}`;

        const collection = new RadioCollection(
            crypto.randomUUID(),
            collectionName
        );

        this.collections.push(collection);

        return collection;
    }

    removeCollection(collectionId: string): boolean {
        if (collectionId === FAVORITES_COLLECTION_ID) {
            return false;
        }

        const index = this.collections.findIndex(
            collection => collection.id === collectionId
        );

        if (index === -1) {
            return false;
        }
        
        this.collections.splice(index, 1);

        return true;
    }

    addStationToCollection(
        collectionId: string,
        stationId: string
    ): boolean {
        if (!this.stationsById.has(stationId)) {
            return false;
        }
        
        const collection = this.getCollection(collectionId);

        return collection?.addStation(stationId) ?? false;
    }

    removeStationFromCollection(
        collectionId: string,
        stationId: string
    ): boolean {
        const collection = this.getCollection(collectionId);

        return collection?.removeStation(stationId) ?? false;
    }

    toggleStationFromCollection(
        collectionId: string,
        stationId: string
    ): boolean {
        if (!this.stationsById.has(stationId)) {
            return false;
        }

        const collection = this.getCollection(collectionId);

        return collection?.toggleStation(stationId) ?? false;
    }

    getStation(stationId: string): RadioStation | undefined {
        return this.stations.find(
            station => station.id === stationId
        );
    }
}
