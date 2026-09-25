// storage.ts
import { RadioLibrary } from '../models/radio-library'
import { type RadioStation } from "../models/radio-station";
import { RadioCollection } from "../models/radio-collection";

const STORAGE_KEY = "radio-player-library";

interface LoadedCollectionData {
    id: string,
    name: string,
    stationIds?: string[]
}

interface LoadedLibraryData {
    stations?: RadioStation[],
    collections?: LoadedCollectionData[]
}


export function loadLibrary(): RadioLibrary {
    const value = localStorage.getItem(STORAGE_KEY);

    if (!value) {
        return new RadioLibrary([], []);
    }

    const data = JSON.parse(value) as LoadedLibraryData;

    const collections = (data.collections ?? []).map(
        collection => 
            new RadioCollection(
                collection.id ?? crypto.randomUUID(),
                collection.name,
                collection.stationIds ?? []
            ),
    );

    return new RadioLibrary(
        data.stations ?? [],
        collections
    );
}


export function saveLibrary(library: RadioLibrary): void {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            stations: library.stations,
            collections: library.collections
        }),
    );
}
