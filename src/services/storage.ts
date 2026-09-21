// storage.ts
import type { RadioLibrary } from "../models/radio-library";

const STORAGE_KEY = "radio-player-library";


export function loadLibrary(): RadioLibrary | null {
    const value = localStorage.getItem(STORAGE_KEY);

    return value
        ? JSON.parse(value) as RadioLibrary
        : null
}

export function saveLibrary(library: RadioLibrary): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}
