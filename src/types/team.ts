import type { IUser } from './auth';
import type { ITenantRef, PersonType } from './customer';

/**
 * Discriminator returned by `GET /api/site/me` so the front knows which
 * profile field to read. `USER` is the catch-all for tokens without any
 * site-side role (unlikely in practice).
 */
export type SiteRole = 'CUSTOMER' | 'MANAGER' | 'AGENT' | 'USER';

/**
 * Branch/Filial reference projection. Returned as `{id, name}` when the
 * backend embeds an agency inside Manager/Agent or Membership payloads.
 */
export interface IRealEstateAgencyRef {
    id: number;
    name?: string;
}

/**
 * Manager profile for the logged-in user when the token carries
 * `ROLE_MANAGER`. Manager belongs to one tenant and can be linked to many
 * branches.
 *
 * Source: `GET /api/site/me` (role=MANAGER).
 */
export interface IManager {
    id: number;
    personType: PersonType;
    naturalPersonDocument?: string | null;
    entityDocument?: string | null;
    creciNumber?: string | null;
    participatesInRoulette: boolean;
    user?: Pick<IUser, 'id' | 'login'> | IUser | null;
    tenant: ITenantRef;
    realEstateAgencies: IRealEstateAgencyRef[];
}

/**
 * RealEstateAgent (corretor) profile for the logged-in user when the token
 * carries `ROLE_AGENT`. Belongs to one tenant and one branch.
 *
 * Source: `GET /api/site/me` (role=AGENT).
 */
export interface IRealEstateAgent {
    id: number;
    phoneNumber?: string | null;
    creciNumber?: string | null;
    participatesInHub: boolean;
    participatesInRoulette: boolean;
    user?: Pick<IUser, 'id' | 'login'> | IUser | null;
    tenant: ITenantRef;
    realEstateAgency: IRealEstateAgencyRef;
}
