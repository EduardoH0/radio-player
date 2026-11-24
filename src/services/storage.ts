// storage.ts
import { RadioLibrary } from '../models/radio-library'
import { type RadioStation } from "../models/radio-station";
import { RadioCollection } from "../models/radio-collection";
import { PlayHistory } from "../models/play-history";
import type { HistoryEntry } from "../models/history-entry";

const LIBRARY_STORAGE_KEY = "radio-player-library";
const HISTORY_STORAGE_KEY = "radio-player-history";

interface LoadedCollectionData {
    id: string,
    name: string,
    stationIds?: string[]
}

interface LoadedLibraryData {
    stations?: RadioStation[],
    collections?: LoadedCollectionData[]
}

interface LoadedHistoryData {
    entries?: HistoryEntry[]
}

export function loadHistory(): PlayHistory {
    const value = localStorage.getItem(HISTORY_STORAGE_KEY);

    if (!value) {
        return new PlayHistory([]);
    }

    const data = JSON.parse(value) as LoadedHistoryData;

    const history = new PlayHistory(data.entries ?? [])
    history.prune();
    return history
}

export function saveHistory(history: PlayHistory): void {
    localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify({ entries: history.entries })
    );
}

export function loadLibrary(): RadioLibrary {
    const value = localStorage.getItem(LIBRARY_STORAGE_KEY);

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
        LIBRARY_STORAGE_KEY,
        JSON.stringify({
            stations: library.stations,
            collections: library.collections
        }),
    );
}
