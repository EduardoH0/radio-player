// input-dialog.ts

export interface InputOptions {
    title: string;
    placeholder: string;
    confirmText?: string;
    cancelText?: string;
}


export class InputDialog {
    private readonly root: HTMLDivElement;
    private readonly backdrop: HTMLDivElement;
    private readonly dialog: HTMLDivElement;
    private readonly title: HTMLHeadingElement;
    private readonly input: HTMLInputElement;
    private readonly confirmButton: HTMLButtonElement;
    private readonly cancelButton: HTMLButtonElement;

    private resolve: ((value: string | null ) => void) | null = null;

    constructor() {
        this.backdrop = document.createElement("div");
        this.backdrop.className = "input-dialog-backdrop";
        this.backdrop.addEventListener("click", () => { this.close(null); });

        this.title = document.createElement("h2");
        this.title.className = "input-dialog-title";

        this.input = document.createElement("input");
        this.input.className = "input-dialog-input";

        this.confirmButton = document.createElement("button");
        this.confirmButton.className = "input-dialog-btn";
        this.confirmButton.id = "input-dialog-btn-confirm";
        this.confirmButton.addEventListener("click", () => {
            const name = this.input.value.trim();
            if (!name) {
                this.close(null);
            }
            this.close(name);
        });

        this.cancelButton = document.createElement("button");
        this.cancelButton.className = "input-dialog-btn";
        this.cancelButton.id = "input-dialog-btn-cancel";
        this.cancelButton.addEventListener("click", () => { this.close(null); });

        const actions = document.createElement("div");
        actions.className = "input-dialog-actions";
        actions.append(this.cancelButton, this.confirmButton);

        this.dialog = document.createElement("div");
        this.dialog.className = "confirmation-dialog-content";
        this.dialog.append(this.title, this.input, actions);

        this.root = document.createElement("div");
        this.root.className = "input-dialog";
        this.root.hidden = true;
        this.root.append(this.backdrop, this.dialog);

        document.body.appendChild(this.root);
    }

    open(options: InputOptions): Promise<string | null> {
        this.title.textContent = options.title;
        this.input.placeholder = options.placeholder;
        this.input.value = "";

        this.confirmButton.textContent = options.confirmText ?? "Confirm";
        this.cancelButton.textContent = options.cancelText ?? "Cancel";

        this.root.hidden = false;

        requestAnimationFrame(() => {  // request... not needed unless animated..
            this.root.classList.add("open");
            this.input.focus();
        });

        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    close(value: string | null): void {
        this.root.classList.remove("open");

        this.resolve?.(value);
        this.resolve = null;

        window.setTimeout(() => {
            this.root.hidden = true;
        }, 20);
    }
}
