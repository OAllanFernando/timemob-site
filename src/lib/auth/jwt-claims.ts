import { TOKEN_STORAGE_KEY } from '@/lib/axios';

export const SITE_AUDIENCE = 'site';

export interface ISiteJwtClaims {
    sub: string;
    auth: string;
    userId: number;
    aud?: string | string[];
    tenantId?: number;
    managerId?: number;
    realEstateAgentId?: number;
    customerId?: number;
    realEstateAgencies?: number[];
    iat: number;
    exp: number;
}

function decodeBase64Url(input: string): string {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4;
    return atob(pad ? padded + '='.repeat(4 - pad) : padded);
}

export function readSiteJwtClaims(): ISiteJwtClaims | null {
    if (typeof window === 'undefined') return null;
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
        return JSON.parse(decodeBase64Url(payload)) as ISiteJwtClaims;
    } catch {
        return null;
    }
}

export function hasSiteAudience(claims: ISiteJwtClaims | null): boolean {
    if (!claims?.aud) return true;
    if (Array.isArray(claims.aud)) return claims.aud.includes(SITE_AUDIENCE);
    return claims.aud === SITE_AUDIENCE;
}

export function getMyTenantId(): number | null {
    return readSiteJwtClaims()?.tenantId ?? null;
}
