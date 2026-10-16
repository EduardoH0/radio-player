export type ViewMode = "favorites" | "library" | "collection";


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

        document.querySelectorAll<HTMLElement>("[data-view]").forEach(el => {
            el.classList.toggle(
                "active",
                el.dataset.view?.split(" ").includes(mode) ?? false
            );
        });
    }

    setCompactTitle(title: string | null): void {
        const el = document.querySelector<HTMLSpanElement>("#top-nav-info-text");
        if (!el) return;

        el.textContent = title ?? "";
    }
}
