// confirmation-dialog.ts

export interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}


export class ConfirmationDialog {
    private readonly root: HTMLDivElement;
    private readonly backdrop: HTMLDivElement;
    private readonly dialog: HTMLDivElement;
    private readonly title: HTMLHeadingElement;
    private readonly message: HTMLParagraphElement;
    private readonly confirmButton: HTMLButtonElement;
    private readonly cancelButton: HTMLButtonElement;

    private resolve: ((confirmed: boolean) => void) | null = null;

    constructor() {
        this.backdrop = document.createElement("div");
        this.backdrop.className = "confirmation-dialog-backdrop";
        this.backdrop.addEventListener("click", () => { this.close(false); });

        this.title = document.createElement("h2");
        this.title.className = "confirmation-dialog-title";

        this.message = document.createElement("p");
        this.message.className = "confirmation-dialog-message";

        this.confirmButton = document.createElement("button");
        this.confirmButton.className = "confirmation-dialog-btn";
        this.confirmButton.id = "confirmation-dialog-btn-confirm";
        this.confirmButton.addEventListener("click", () => { this.close(true); });

        this.cancelButton = document.createElement("button");
        this.cancelButton.className = "confirmation-dialog-btn";
        this.cancelButton.id = "confirmation-dialog-btn-cancel";
        this.cancelButton.addEventListener("click", () => { this.close(false); });

        const actions = document.createElement("div");
        actions.className = "confirmation-dialog-actions";
        actions.append(this.cancelButton, this.confirmButton);

        this.dialog = document.createElement("div");
        this.dialog.className = "confirmation-dialog-content";
        this.dialog.append(this.title, this.message, actions);

        this.root = document.createElement("div");
        this.root.className = "confirmation-dialog";
        this.root.hidden = true;
        this.root.append(this.backdrop, this.dialog);

        document.body.appendChild(this.root);
    }

    open(options: ConfirmationOptions): Promise<boolean> {
        this.title.textContent = options.title;
        this.message.textContent = options.message;
        this.confirmButton.textContent = options.confirmText ?? "Confirm";
        this.cancelButton.textContent = options.cancelText ?? "Cancel";

        this.root.hidden = false;

        requestAnimationFrame(() => {  // request... not needed unless animated..
            this.root.classList.add("open");
        });

        // Store the promise resolver so close() can resolve it with the user's choice
        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    close(confirmed: boolean): void {
        this.root.classList.remove("open");

        this.resolve?.(confirmed);
        this.resolve = null;

        window.setTimeout(() => {
            this.root.hidden = true;
        }, 20);
    }
}
