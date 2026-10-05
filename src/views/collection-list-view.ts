// collection-list-view.ts
import type { Collection } from "../models/radio-collection";
import { createCollectionElement } from "../elements/collection-element";


export class CollectionListView {
    private readonly container: HTMLDivElement;
    private readonly onSelect: (collectionId: string) => void;

    constructor(container: HTMLDivElement, onSelect: (collectionId: string) => void) {
        this.container = container;
        this.onSelect = onSelect;
    }

    render(collections: Collection[]): void {
        this.container.replaceChildren();

        for (const collection of collections) {
            const element = createCollectionElement(
                collection,
                this.onSelect
            );

            element.dataset.collectionId = collection.id;

            this.container.append(element);
        }
    }
}

export function setActiveCollection(collectionId: string | null): void {
    document.querySelector(".collection.active")?.classList.remove("active");

    if (!collectionId) {
        return;
    }

    document.querySelector(`[data-collection-id="${collectionId}"]`)
        ?.classList.add("active");
}
