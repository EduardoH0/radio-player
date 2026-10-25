// top-bar.ts


export class TopBar {
    private readonly title: HTMLElement;
    private readonly searchBtn: HTMLButtonElement;
    private readonly searchField: HTMLDivElement;
    private readonly searchInput: HTMLInputElement;
    private readonly searchClearBtn: HTMLButtonElement;
    private readonly onQuery: (query: string) => void;

    private currentTitle: string | null = null;
    private searching: boolean = false;

    constructor(
        title: HTMLElement,
        searchBtn: HTMLButtonElement,
        searchField: HTMLDivElement,
        searchInput: HTMLInputElement,
        searchClearBtn: HTMLButtonElement,
        onQuery: (query: string) => void,
    ) {

        this.title = title;
        this.searchBtn = searchBtn;
        this.searchField = searchField;
        this.searchInput = searchInput;
        this.searchClearBtn = searchClearBtn;
        this.onQuery = onQuery;

        this.searchBtn.addEventListener("click", () => {
            this.setSearching(!this.searching);
        });
        this.searchInput.addEventListener("input", () => {
            this.searchClearBtn.hidden = this.searchInput.value === "";
            this.onQuery(this.searchInput.value);
        });
        this.searchInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                this.searchInput.blur();
            }
        });
        this.searchInput.enterKeyHint = "search";

        document.addEventListener("touchmove", event => {
            if (event.target !== this.searchInput) {
                this.dismissKeyboard();
            }
        },
        // 'passive: true': event listener will not call preventDefault
        // may lead to smoother scrolling, since the browser does not need to
        // wait to see whether the handler will cancel the touch
        { passive: true }
        );

        // // Stop the button from stealing focus on press (avoid keyboard flickering)
        // this.searchClearBtn.addEventListener("mousedown", event => {
        //     event.preventDefault();
        // });
        this.searchClearBtn.addEventListener("click", () => {
            this.searchInput.value = "";
            this.searchInput.dispatchEvent(new Event("input"));
            this.searchInput.focus();
        });
    }

    setTitle(title: string | null): void {
        this.currentTitle = title;
        this.title.textContent = title ?? "";
        this.title.hidden = title == null || this.searching;
    }

    private dismissKeyboard(): void {
        if (document.activeElement === this.searchInput) {
            this.searchInput.blur();
        }
    }

    closeSearch(): void {
        this.setSearching(false);
    }

    private setSearching(on: boolean): void {
        this.searching = on;
        this.searchField.hidden = !on;
        if (on) {
            this.searchInput.focus();
        } else {
            this.searchInput.value = "";
            this.searchInput.dispatchEvent(new Event("input"));
        }
        this.setTitle(this.currentTitle);
    }
}
