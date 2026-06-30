import type { PropertyBusinessType, PropertyType } from '@/types/customer';

/**
 * Property registration types for the agency backoffice (`/painel/imoveis`). Mirrors the backend
 * `PropertyDTO` consumed by `/api/site/properties` (aud="site", MANAGER/AGENT). Tenant is resolved
 * server-side from the token — never sent from the client. Geography is sent nested by name; the
 * backend find-or-creates it (`resolveNeighborhood`), the same way the lead/interest flows do.
 */

export type { PropertyBusinessType, PropertyType } from '@/types/customer';

export type PropertyStatus =
    | 'DRAFT'
    | 'PUBLISHED'
    | 'HIDDEN'
    | 'RESERVED'
    | 'SOLD'
    | 'RENTED'
    | 'WAITING_REVISION'
    | 'DISAPPROVED';

export type SolarOrientation =
    | 'NORTH'
    | 'SOUTH'
    | 'EAST'
    | 'WEST'
    | 'NORTHEAST'
    | 'NORTHWEST'
    | 'SOUTHEAST'
    | 'SOUTHWEST';

export type PropertyPosition =
    | 'FRONT'
    | 'BACK'
    | 'SIDE'
    | 'FRONT_SEA_VIEW'
    | 'SEA_VIEW'
    | 'OPEN_VIEW'
    | 'CORNER'
    | 'INTERNAL';

/** Nested geography the backend resolves by name (find-or-create). */
export interface IPropertyNeighborhood {
    id?: number;
    name: string;
    city: {
        id?: number;
        name: string;
        state: {
            id?: number;
            name: string;
            uf?: string;
            country: { id?: number; name: string; code?: string };
        };
    };
}

export interface IMediaSummary {
    id?: number;
    url?: string;
}

/** Document category (mirrors backend `DocumentCategory`). */
export type DocumentCategory =
    | 'SALE_AUTHORIZATION'
    | 'PROPERTY_REGISTRATION'
    | 'DEED'
    | 'CONTRACT'
    | 'OTHER';

/** A property media row — photo (`/media`) or document (`/documents`). */
export interface IMedia {
    id: number;
    url?: string;
    fileName?: string;
    isPrimary?: boolean;
    order?: number;
    mediaType?: string;
    documentCategory?: DocumentCategory;
}

/** Row shape for the inventory list (`GET /api/site/properties`). */
export interface IPropertyListItem {
    id: number;
    title?: string | null;
    amount?: number | null;
    propertyType?: string | null;
    propertyBusinessType?: string | null;
    propertyStatus?: string | null;
    media?: IMediaSummary | null;
    bedroom?: number | null;
    bathroom?: number | null;
    carVacancy?: number | null;
}

/** Write payload. Required fields match the backend `@NotNull` columns. */
export interface IPropertyInput {
    id?: number;

    title?: string | null;
    description?: string | null;
    amount: number;
    propertyBusinessType: PropertyBusinessType;
    propertyType: PropertyType;
    propertyStatus: PropertyStatus;
    featured: boolean;

    postalCode?: string | null;
    streetName?: string | null;
    number?: string | null;
    condominium?: string | null;
    tower?: string | null;
    lot?: string | null;
    neighborhood?: IPropertyNeighborhood | null;
    latitude?: number | null;
    longitude?: number | null;
    solarOrientation?: SolarOrientation | null;
    propertyPosition?: PropertyPosition | null;
    beachDistance?: string | null;

    condominiumTax?: number | null;
    iptuAmount?: number | null;
    expectedCommissionPercentage?: number | null;
    featuredCommissionPercentage?: number | null;

    bedroom?: number | null;
    suite?: number | null;
    bathroom?: number | null;
    carVacancy?: number | null;
    totalArea?: number | null;
    utilArea?: number | null;
    differentials?: string | null;

    exclusive?: boolean | null;
    homeShow?: boolean | null;
    visitResponsibleName?: string | null;
    visitResponsiblePhoneNumber?: string | null;
    expectedVisitDurationMinutes?: number | null;
}

/** Full detail returned by `GET /api/site/properties/{id}` (write payload + server-managed fields). */
export interface IProperty extends IPropertyInput {
    id: number;
    slug?: string | null;
}
