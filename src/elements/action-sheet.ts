// action-sheet.ts

export interface SheetAction {
    id: string;
    label: string;
    icon?: string;
    // destructive?: boolean;
}

export class ActionSheet {
    private readonly root: HTMLDivElement;
    private readonly backdrop: HTMLDivElement;
    private readonly list: HTMLDivElement;
    private onSelect: ((actionId: string) => void) | null = null;

    constructor() {
        this.backdrop = document.createElement("div");
        this.backdrop.className = "action-sheet-backdrop";
        this.backdrop.addEventListener("click", () => { this.close(); });

        this.list = document.createElement("div");
        this.list.className = "action-sheet-list";

        this.root = document.createElement("div");
        this.root.className = "action-sheet";
        this.root.hidden = true;
        this.root.append(this.backdrop, this.list);

        document.body.appendChild(this.root);
    }

    open(actions: SheetAction[], onSelect: (actionId: string) => void): void {
        this.onSelect = onSelect;
        this.list.replaceChildren();

        for (const action of actions) {
            const item = document.createElement("button");
            item.className = "action-sheet-item";

            const icon = document.createElement("span");
            icon.className = "action-sheet-item-icon";

            if (action.icon) {
                const image = document.createElement("img");
                image.src = action.icon;
                icon.appendChild(image);
            }

            const label = document.createElement("span");
            label.className = "action-sheet-item-label";
            label.textContent = action.label;

            item.append(icon, label);

            item.addEventListener("click", () => {
                this.onSelect?.(action.id);
            });

            this.list.appendChild(item);
        }

        this.root.hidden = false;
        requestAnimationFrame(() => { this.root.classList.add("open"); });
    }

    close(): void {
        this.root.classList.remove("open");
        this.onSelect = null;

        // listen to animation end instead? time here must be on sync with
        // hardcoded on .css
        window.setTimeout(() => { this.root.hidden = true; }, 200);
    }
}
