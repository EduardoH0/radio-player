export type ViewMode = "favorites" | "library" | "collection";


const VIEW_SELECTORS: Record<ViewMode, string> = {
    favorites: "#favorite-view",
    library: "#library-view",
    collection: "#collection-view"
};

export class ViewManager {
    private current: ViewMode = "favorites";

    get mode(): ViewMode {
        return this.current;
    }

    show(mode: ViewMode): void {
        if (this.current === mode) {
            return;
        }

        this.current = mode;

        document.querySelectorAll(".view.active").forEach(view => {
            view.classList.remove("active");
        });

        document.querySelector(VIEW_SELECTORS[mode])?.classList.add("active");
    }
}
