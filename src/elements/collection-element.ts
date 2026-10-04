// collection-element.ts
import type { Collection } from "../models/radio-collection";


type CollectionClickHandler = (
    collectionId: string
) => void;

export function createCollectionElement(
    collection: Collection,
    onClick: CollectionClickHandler,
): HTMLDivElement {

    const element = document.createElement("div");
    element.className = "collection";
    element.tabIndex = 0;

    element.innerHTML = `
        <div class="collection-left">
            <svg viewBox="0 0 512 512"><path d="M16 420a28 28 0 0 0 28 28h424a28 28 0 0 0 28-28V208H16ZM496 124a28 28 0 0 0-28-28H212.84l-48-32H44a28 28 0 0 0-28 28v84h480Z"/></svg>
        </div>

        <div class="collection-content">

            <div class="collection-row-1">

                <span class="collection-title">
                    ${collection.name}
                </span>

            </div>

        </div>
    `;

    element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick(collection.id);
        }
    });

    element.addEventListener(
        "click",
        () => { onClick(collection.id); }
    );

    return element;
}
