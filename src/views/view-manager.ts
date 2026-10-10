export type ViewMode = "favorites" | "library" | "collection";


const VIEW_SELECTORS: Record<ViewMode, string> = {
    favorites: "#favorite-view",
    library: "#library-view",
    collection: "#collection-view"
};

const VIEW_BUTTONS_SELECTORS: Record<ViewMode, string> = {
    favorites: "#favorite-view-btn",
    library: "#library-view-btn",
    collection: "#library-view-btn"
}

export class ViewManager {
    private current: ViewMode | null = null;

    get mode(): ViewMode | null {
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
        document.querySelectorAll(".view-btn.active").forEach(viewBtn => {
            viewBtn.classList.remove("active");
        });

        document.querySelector(VIEW_SELECTORS[mode])?.classList.add("active");
        document.querySelector(VIEW_BUTTONS_SELECTORS[mode])?.classList.add("active");
    }
}
