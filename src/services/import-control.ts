import { importLibrary } from "./library-file"
import type { RadioLibrary } from "../models/radio-library"


export function attachImportControl(onImported: (library: RadioLibrary) => void): void {
    const importButton = document.querySelector<HTMLButtonElement>(
        "#import-library-btn"
    );
    const fileInput = document.querySelector<HTMLInputElement>(
        "#import-file"
    );

    importButton?.addEventListener("click", () => { fileInput?.click(); });

    fileInput?.addEventListener("change", () => {
        void (async () => {
            const file = fileInput.files?.[0];

            if (!file) {
                return;
            }

            onImported(await importLibrary(file));
            fileInput.value = "";  // allow re-importing the same file
        })()
    });
}
