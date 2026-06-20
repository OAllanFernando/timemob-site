import type { IUser } from './auth';

/**
 * Lifecycle state of a CustomerMembership inside one tenant (see backend JDL).
 * The same Customer (global) can sit at different stages across different tenants.
 */
export type LeadStatus =
    | 'NEW'
    | 'CONTACTED'
    | 'IN_PROGRESS'
    | 'VISIT_SCHEDULED'
    | 'PROPOSAL_SENT'
    | 'NEGOTIATION'
    | 'WON'
    | 'LOST'
    | 'INACTIVE';

export type PersonType = 'NATURAL_PERSON' | 'LEGAL_ENTITY';

/**
 * Canonical Customer — one row per person, multi-tenant. Email/CPF/CNPJ are
 * unique and serve as natural keys for lead capture dedup. Carries identity
 * only; everything per-tenant lives in {@link ICustomerMembership}.
 */
export interface ICustomer {
    id: number;
    name: string;
    email?: string;
    phoneNumber: string;
    whatsapp?: string;
    postalCode?: string;
    streetName?: string;
    number?: string;
    complement?: string;
    naturalPersonDocument?: string;
    entityDocument?: string;
    personType: PersonType;
    user?: IUser | null;
}

export interface IBranchRef {
    id: number;
    name?: string;
}

export interface ICampaignRef {
    id: number;
    name?: string;
}

export interface IRealEstateAgentRef {
    id: number;
}

export interface ITenantRef {
    id: number;
    name?: string;
}

/**
 * Per-tenant link of a global Customer to one agency. Unique (customer, tenant).
 * Created at lead capture / self-register; updated as the lead moves through
 * the funnel. The site only ever sees the membership for its own tenant
 * (resolved via the X-Tenant-Id header).
 */
export interface ICustomerMembership {
    id: number;
    leadStatus: LeadStatus;
    leadSource?: string;
    message?: string;
    termsAndConditionsAccept?: string;
    lastContactAt?: string;
    customer: ICustomer;
    tenant: ITenantRef;
    branch?: IBranchRef;
    campaign?: ICampaignRef;
    responsibleBroker?: IRealEstateAgentRef;
}

// =============================================================================
// Self-register & lead capture — request/response contracts.
// Endpoints land in a follow-up slice; types are locked here so backend and
// front evolve against the same shape.
// =============================================================================

/**
 * Anonymous "fale conosco" form. No account is created — just a Customer
 * (dedup'd by email/CPF) and a Membership for the current tenant with
 * leadStatus=NEW.
 *
 * Endpoint: POST /api/site/leads (public)
 * Header:   X-Tenant-Id (axios interceptor; set from NEXT_PUBLIC_TENANT_ID)
 */
export interface IPublicLeadRequest {
    name: string;
    email?: string;
    phoneNumber: string;
    whatsapp?: string;
    message?: string;
    leadSource?: string;
    /** Optional context: id of the property the visitor was viewing. */
    propertyId?: number;
}

export interface IPublicLeadResponse {
    /** Id of the CustomerMembership created/updated for this tenant. */
    membershipId: number;
}

/**
 * Self-register flow: visitor creates a real login.
 * Backend creates User + Customer + Membership(leadStatus=NEW) in one
 * transactional unit and returns the JWT — the front auto-logs in.
 *
 * Endpoint: POST /api/site/register (public)
 * Header:   X-Tenant-Id
 * Conflict: email already in use → 409, errorKey "userexists" or "emailexists";
 *           front routes to /login with prefilled email.
 */
export interface ICustomerRegistrationRequest {
    name: string;
    email: string;
    phoneNumber: string;
    whatsapp?: string;
    password: string;
    naturalPersonDocument?: string;
    entityDocument?: string;
    personType: PersonType;
    /** Required true. Backend timestamps termsAndConditionsAccept on the Membership. */
    acceptTerms: boolean;
    leadSource?: string;
}

export interface ICustomerRegistrationResponse {
    id_token: string;
}

/**
 * Logged-in Customer fetches its own canonical profile + the Membership for
 * the current tenant (resolved by X-Tenant-Id header).
 *
 * Endpoint: GET /api/site/customers/me (authenticated, aud="site")
 */
export interface IMyCustomerResponse {
    customer: ICustomer;
    membership: ICustomerMembership;
}

/**
 * Logged-in Customer updates the canonical fields of its own profile.
 * Per-tenant fields (leadStatus, branch, responsibleBroker) are NOT editable
 * by the customer — only by the agency through hub endpoints.
 *
 * Endpoint: PATCH /api/site/customers/me (authenticated)
 */
export interface ICustomerSelfUpdateRequest {
    name?: string;
    email?: string;
    phoneNumber?: string;
    whatsapp?: string;
    postalCode?: string;
    streetName?: string;
    number?: string;
    complement?: string;
}
