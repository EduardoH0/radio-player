// view.ts
export interface View {
    readonly compactTitle?: string | null;
    filter(query: string): void;
}
