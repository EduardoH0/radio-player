// library-file.ts
import { RadioLibrary } from '../models/radio-library'
import { type RadioStation } from "../models/radio-station";
import { RadioCollection } from "../models/radio-collection";

interface ImportedCollectionData {
    id: string,
    name: string,
    stationIds?: string[]
}

interface ImportedLibraryData {
    stations?: RadioStation[],
    collections?: ImportedCollectionData[]
}


export async function importLibrary(file: File):Promise<RadioLibrary> {
    const text = await file.text();
    const data = JSON.parse(text) as ImportedLibraryData;

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
