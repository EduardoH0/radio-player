// radio-library.ts
import type { RadioStation } from "./radio-station";


export interface RadioLibrary {
    stations: RadioStation[];
    favorites: string[];
}

export function createLibrary(): RadioLibrary {
    return {
        stations: [],
        favorites: []
    }
}
