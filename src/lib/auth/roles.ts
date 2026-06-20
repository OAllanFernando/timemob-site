export const ROLES = {
    USER: 'ROLE_USER',
    ADMIN: 'ROLE_ADMIN',
    SUPPORT: 'ROLE_SUPPORT',
    SYSTEM: 'ROLE_SYSTEM',
    AGENCY_OWNER: 'ROLE_AGENCY_OWNER',
    MANAGER: 'ROLE_MANAGER',
    AGENT: 'ROLE_AGENT',
    FINANCIAL: 'ROLE_FINANCIAL',
    CUSTOMER: 'ROLE_CUSTOMER',
    ANONYMOUS: 'ROLE_ANONYMOUS',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export type ProfileRole = 'agency_owner' | 'manager' | 'agent' | 'customer' | 'admin' | null;

export function resolveProfileRole(authorities: string[] | undefined): ProfileRole {
    if (!authorities?.length) return null;
    if (authorities.includes(ROLES.AGENCY_OWNER)) return 'agency_owner';
    if (authorities.includes(ROLES.MANAGER)) return 'manager';
    if (authorities.includes(ROLES.AGENT)) return 'agent';
    if (authorities.includes(ROLES.CUSTOMER)) return 'customer';
    if (authorities.includes(ROLES.ADMIN)) return 'admin';
    return null;
}

export function hasRole(authorities: string[] | undefined, role: Role) {
    return !!authorities?.includes(role);
}
