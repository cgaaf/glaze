export type Country = { code: string; name: string };
export declare function dropNetwork(): void;
export declare function searchCountries(query: string): Promise<Country[]>;
export declare function loadCountries(): Promise<Country[]>;
