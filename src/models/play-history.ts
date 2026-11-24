// play-history.ts
import type { HistoryEntry } from "./history-entry";


export class PlayHistory {
    public entries: HistoryEntry[];

    private readonly maxEntries = 1000;
    private readonly maxAge = 24 * 60 * 60 * 1000;

    constructor(entries: HistoryEntry[] = []) {
        this.entries = entries;
    }

    get historyEntries(): HistoryEntry[] {
        return this.entries;
    }

    add(title: string, station: string, now = Date.now()): HistoryEntry | null {
        const normTitle = title.trim().toLowerCase();
        if (!normTitle) return null;

        const exists = this.entries.some(
            entry => 
                entry.station === station &&
                entry.title === title
        );

        if (exists) return null;

        const entry = {
            title,
            station,
            playedAt: now
        };
        this.entries.unshift(entry);
        this.entries.length = Math.min(this.entries.length, this.maxEntries);
        return entry;
    }

    prune(maxAge: number = this.maxAge, now = Date.now()): void {
        const cutOff = now - maxAge; 

        this.entries = this.entries
            .filter(entry => entry.playedAt >= cutOff)
            .slice(0, this.maxEntries);
    }
}
