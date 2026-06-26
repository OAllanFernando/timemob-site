/**
 * Geography reference types for the location pickers (Estado → Cidade → Bairro).
 * Mirrors the hub's location summaries; populated from the read-only listing
 * endpoints (`/states|cities|neighborhoods/hub/list`, reachable with a site
 * token since the customer also carries ROLE_USER).
 */
export interface ICountrySummary {
    id?: number;
    name: string;
    code?: string;
}

export interface IStateSummary {
    id?: number;
    name: string;
    uf?: string;
    country?: ICountrySummary;
}

export interface ICitySummary {
    id?: number;
    name: string;
    uf?: string;
    state?: IStateSummary;
}

export interface INeighborhood {
    id?: number;
    name: string;
    city?: ICitySummary;
}
