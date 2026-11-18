export type Project = { name: string; edited: string };
export declare function failNextSave(): void;
export declare function loadProject(): Promise<Project>;
export declare function saveProject(next: string): Promise<string>;
