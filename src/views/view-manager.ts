// view-manager.ts
import { type View } from "./view";


export type ViewMode = "favorites" | "library" | "collection";


export class ViewManager {
    private current: ViewMode | null = null;
    private readonly views = new Map<ViewMode, View>();

    onShow?: () => void;

    get mode(): ViewMode | null {
        return this.current;
    }

    get activeView(): View | null {
        return this.current ? this.views.get(this.current) ?? null : null;
    }

    register(mode: ViewMode, view: View): void {
        this.views.set(mode, view);
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

        this.onShow?.();
    }
}
