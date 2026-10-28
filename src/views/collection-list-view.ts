// collection-list-view.ts
import type { Collection } from "../models/radio-collection";
import { createCollectionElement } from "../elements/collection-element";
import { type InputDialog } from "../elements/input-dialog";
import { RadioCollection } from "../models/radio-collection";


export class CollectionListView {
    private readonly container: HTMLDivElement;
    private readonly inputDialog: InputDialog;
    private readonly createCollectionButton: HTMLButtonElement;
    private readonly onSelect: (collectionId: string) => void;
    private readonly onCreate: (collectionName: string) => void;

    private query: string = "";

    constructor(
        container: HTMLDivElement,
        inputDialog: InputDialog,
        onSelect: (collectionId: string) => void,
        onCreate: (collectionName: string) => void,
    ) {
        this.container = container;
        this.inputDialog = inputDialog;
        this.onSelect = onSelect;
        this.onCreate = onCreate;

        this.createCollectionButton = 
            document.querySelector<HTMLButtonElement>("#create-collection-btn")!;
        this.createCollectionButton.addEventListener("click", () => {
            this.createCollection();
        });
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

        // Apply current filter, if any, on render
        this.filter(this.query);
    }

    private async createCollection(): Promise<RadioCollection | void> {
        const name = await this.inputDialog.open({
            title: "New collection",
            placeholder: "Collection name",
            confirmText: "Create"
        });

        if (name === null) {
            return;
        }

        return this.onCreate(name);
    }

    filter(query: string): void {
        this.query = query.trim().toLowerCase();

        this.container.querySelectorAll<HTMLElement>(".collection").forEach(el => {
            const words = (el.textContent ?? "").toLowerCase().split(/\s+/);
            const tokens = this.query.split(/\s+/).filter(Boolean);

            el.hidden = !tokens.every(token =>
                words.some(word => word.startsWith(token))
            );
        });
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
