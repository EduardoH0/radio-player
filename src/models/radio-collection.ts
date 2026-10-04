// radio-collection.ts

export interface Collection {
    id: string,
    name: string
}

export class RadioCollection {
    public readonly id: string;
    public name: string;
    public stationIds: string[];

    constructor(id: string, name: string = "Unknown", stationIds: string[] = []) {
        this.id = id;
        this.name = name;
        this.stationIds = stationIds;
    }

    containsStation(stationId: string): boolean {
        return this.stationIds.includes(stationId);
    }

    addStation(stationId: string): boolean {
        if (this.containsStation(stationId)) {
            return false
        }

        this.stationIds.push(stationId);
        return true
    }

    removeStation(stationId: string): boolean {
        const index = this.stationIds.indexOf(stationId);
        
        if (index === -1) {
            return false
        }
        
        this.stationIds.splice(index, 1);
        return true
    }
    
    toggleStation(stationId: string): boolean {
        if (this.containsStation(stationId)) {
            return this.removeStation(stationId);
        } else {
            return this.addStation(stationId);
        }
    }
}
