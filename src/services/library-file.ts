// library-file.ts
import { type RadioLibrary } from '../models/radio-library'


export async function importLibrary(file: File):Promise<RadioLibrary> {
    const text = await file.text();
    return JSON.parse(text);
}
