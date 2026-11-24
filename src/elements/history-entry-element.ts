// history-entry-element.ts
import type { HistoryEntry } from "../models/history-entry";


export function createHistoryEntryElement(
    historyEntry: HistoryEntry,
): HTMLDivElement {

    const element = document.createElement("div");
    element.className = "history-entry";
    element.tabIndex = 0;

    element.innerHTML = `
        <div class="history-entry-content">
            <div class="history-entry-row-1">
                <div class="history-entry-title"></div>
            </div>
            <div class="history-entry-row-2">
                <div class="history-entry-time"></div>
                <span> · </span>
                <div class="history-entry-station"></div>
            </div>
        </div>

        <div class="history-entry-right">
            <button class="history-entry-copy-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="ionicon">
                    <g transform="translate(110 -110)">
                        <rect id="copy-fill" x="76" y="182" width="250" height="250" fill="none" stroke="none" stroke-width="32px"/>
                    </g>
                    <rect id="copy-fill-2" x="76" y="182" width="250" height="250" fill="none" stroke="currentColor" stroke-width="32px"/>
                </svg>
            </button>
        </div>
    `;

    element.querySelector(".history-entry-title")!.textContent = historyEntry.title;
    element.querySelector(".history-entry-station")!.textContent = historyEntry.station;
    const time = new Date(historyEntry.playedAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
    element.querySelector(".history-entry-time")!.textContent = time;

    element.dataset.search = [
        historyEntry.title,
        historyEntry.station,
        time
    ].filter(Boolean).join(" ").toLowerCase();

    element.addEventListener("click", () => { element.classList.toggle("active") });
    
    const copyButton = element.querySelector<HTMLButtonElement>(".history-entry-copy-btn");
    copyButton?.addEventListener('click', async (event) => {
            event.stopPropagation();
            await navigator.clipboard.writeText(historyEntry.title);
            copyButton.classList.add("copied");

            setTimeout(() => {
                copyButton.classList.remove("copied");
            }, 500)
    });
    
    return element;
}
