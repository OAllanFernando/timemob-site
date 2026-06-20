import type { AxiosResponse, RawAxiosResponseHeaders, AxiosResponseHeaders } from 'axios';

import type {
    DomainPagedResponse,
    DomainResponse,
    PageLinks,
    PaginationMeta,
} from '@/types/domain-response';

export function toResponse<T>(res: AxiosResponse<T>): DomainResponse<T> {
    return { data: res.data, status: res.status };
}

export function toPagedResponse<T>(res: AxiosResponse<T[]>): DomainPagedResponse<T> {
    return {
        data: res.data,
        status: res.status,
        pagination: parsePagination(res),
    };
}

function readHeader(
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders | undefined,
    name: string,
): string | undefined {
    if (!headers) return undefined;
    const direct = (headers as Record<string, unknown>)[name];
    if (typeof direct === 'string') return direct;
    if (typeof direct === 'number') return String(direct);
    const upper = (headers as Record<string, unknown>)[name.toUpperCase()];
    if (typeof upper === 'string') return upper;
    if (typeof upper === 'number') return String(upper);
    if ('get' in (headers as object) && typeof (headers as AxiosResponseHeaders).get === 'function') {
        const v = (headers as AxiosResponseHeaders).get(name);
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
    }
    return undefined;
}

function parsePagination<T>(res: AxiosResponse<T[]>): PaginationMeta {
    const totalHeader = readHeader(res.headers, 'x-total-count') ?? '0';
    const totalCount = parseInt(totalHeader, 10) || 0;

    const params = (res.config?.params as Record<string, unknown> | undefined) ?? {};
    const page = parseInt(String(params.page ?? 0), 10) || 0;
    const size = parseInt(String(params.size ?? 20), 10) || 20;
    const totalPages = size > 0 ? Math.ceil(totalCount / size) : 0;

    const links = parseLinkHeader(readHeader(res.headers, 'link'));

    return { totalCount, page, size, totalPages, links };
}

export function parseLinkHeader(linkHeader: string | undefined | null): PageLinks | undefined {
    if (!linkHeader) return undefined;
    const links: PageLinks = {};
    const parts = linkHeader.split(',');
    for (const part of parts) {
        const match = part.match(/<([^>]+)>\s*;\s*rel="([^"]+)"/);
        if (!match) continue;
        const [, url, rel] = match;
        if (rel === 'first' || rel === 'prev' || rel === 'next' || rel === 'last') {
            links[rel] = url;
        }
    }
    return Object.keys(links).length > 0 ? links : undefined;
}
