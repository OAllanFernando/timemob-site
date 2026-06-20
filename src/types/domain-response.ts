export interface PaginationMeta {
    totalCount: number;
    page: number;
    size: number;
    totalPages: number;
    links?: PageLinks;
}

export interface PageLinks {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
}

export interface DomainResponse<T> {
    data: T;
    status: number;
}

export interface DomainPagedResponse<T> {
    data: T[];
    status: number;
    pagination: PaginationMeta;
}

export interface ISpringPage<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    empty: boolean;
}

export type DomainErrorCode =
    | 'network'
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'validation'
    | 'conflict'
    | 'server'
    | 'unknown';

export interface FieldErrorMap {
    [field: string]: string[];
}

export class DomainError extends Error {
    constructor(
        public code: DomainErrorCode,
        message: string,
        public status: number | null,
        public errorKey?: string,
        public fieldErrors?: FieldErrorMap,
    ) {
        super(message);
        this.name = 'DomainError';
    }
}
