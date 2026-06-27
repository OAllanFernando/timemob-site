import type { IUser } from './auth';
import type { IManager, IRealEstateAgent, SiteRole } from './team';

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

/**
 * Stage of a Lead in the funnel (Lead is the demonstration of interest captured
 * by the site, distinct from the per-tenant Membership funnel above).
 */
export type LeadStage =
    | 'NEW'
    | 'ASSIGNED'
    | 'ACCEPTED'
    | 'IN_POOL'
    | 'CONTACTED'
    | 'QUALIFIED'
    | 'CONVERTED'
    | 'DISCARDED';

/**
 * CTA that produced the Lead. Mapped from the radio group on the capture form.
 */
export type LeadSource =
    | 'PROPERTY_TALK'
    | 'KNOW_MORE'
    | 'GENERIC_CONTACT'
    | 'OTHER';

export type PersonType = 'NATURAL_PERSON' | 'LEGAL_ENTITY';

/**
 * Mirrors backend enum `PropertyType` (23 values). The form exposes only a
 * residential-focused subset via `PROPERTY_TYPES` in the schema; the full
 * union is here so DTOs coming back from /api/properties don't fail typing.
 */
export type PropertyType =
    | 'HOUSE'
    | 'APARTMENT'
    | 'TWO_STORY_HOUSE'
    | 'COVERAGE'
    | 'LAND'
    | 'COMMERCIAL_ROOM'
    | 'LAUNCH'
    | 'UNDER_CONSTRUCTION'
    | 'ON_PLANT'
    | 'STUDIO'
    | 'GARAGE'
    | 'KIT_NET'
    | 'FARM'
    | 'RANCH'
    | 'WAREHOUSE'
    | 'OTHER'
    | 'OFFICE'
    | 'SHOPPING_MALL'
    | 'INDUSTRIAL'
    | 'HOTEL'
    | 'BOUTIQUE_HOTEL'
    | 'PENSION'
    | 'HOSTEL';

export type PropertyBusinessType = 'SALE' | 'RENT' | 'DAILY_RENT';

/**
 * Canonical Customer — one row per person, multi-tenant. Email/CPF/CNPJ are
 * unique and serve as natural keys for lead capture dedup. Carries identity
 * only; everything per-tenant lives in {@link ICustomerMembership}.
 */
export interface ICustomer {
    id: number;
    name: string;
    email?: string | null;
    phoneNumber: string;
    whatsapp?: string | null;
    postalCode?: string | null;
    streetName?: string | null;
    number?: string | null;
    complement?: string | null;
    /** Geocoded coordinates of the customer's address (from the map picker). */
    latitude?: number | null;
    longitude?: number | null;
    naturalPersonDocument?: string | null;
    entityDocument?: string | null;
    personType: PersonType;
    /** Backend may return only `{ id, login }` as a back-reference projection. */
    user?: Pick<IUser, 'id' | 'login'> | IUser | null;
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

export interface IPropertyRef {
    id: number;
    title?: string;
}

/**
 * Lightweight property marker for the lead-detail map (`GET /api/site/properties/nearby`):
 * coordinates + a price/type label, nothing heavy.
 */
export interface IPropertyMapMarker {
    id: number;
    title?: string;
    latitude?: number;
    longitude?: number;
    amount?: number;
    propertyType?: PropertyType;
    propertyBusinessType?: PropertyBusinessType;
    bedroom?: number;
    bathroom?: number;
}

/**
 * Per-tenant link of a global Customer to one agency. Unique (customer, tenant).
 * Created at lead capture / self-register; updated as the lead moves through
 * the funnel. The site only ever sees the membership for its own tenant
 * (resolved via the tenant headers).
 */
export interface ICustomerMembership {
    id: number;
    leadStatus: LeadStatus;
    leadSource?: string | null;
    message?: string | null;
    termsAndConditionsAccept?: string | null;
    lastContactAt?: string | null;
    customer: ICustomer;
    tenant: ITenantRef;
    branch?: IBranchRef | null;
    campaign?: ICampaignRef | null;
    responsibleBroker?: IRealEstateAgentRef | null;
}

// =============================================================================
// Self-register & lead capture — request/response contracts.
// Backend resolves the tenant from headers (X-Tenant-Slug, with X-Tenant-Id as
// fallback). The front never sends tenantId in the body.
// =============================================================================

/**
 * Anonymous "fale conosco" form. No account is created — just a Lead with
 * stage=NEW (and a Customer dedup'd by email/CPF if the visitor returns).
 * If an Authorization header is present, the backend links the Lead to the
 * logged-in Customer automatically.
 *
 * Endpoint: POST /api/site/leads (public; token optional)
 */
export interface IPublicLeadRequest {
    name: string;
    email: string;
    phone: string;
    message?: string;
    source: LeadSource;
    interestTags?: string[];
    /** Location of interest the visitor marked on the map (a point). */
    latitude?: number;
    longitude?: number;
    /** Optional context: id of the property the visitor was viewing. */
    propertyOfInterest?: IPropertyRef;
    /** Optional: id of the Customer the lead belongs to (only set when known). */
    customer?: { id: number };
}

/**
 * Backend returns the full LeadDTO. The front doesn't consume the response
 * today, but the shape is locked here so callers can read fields safely
 * (e.g. surfacing the assigned broker right after submit).
 */
export interface IPublicLeadResponse {
    id: number;
    stage: LeadStage;
    source: LeadSource;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    interestTags?: string[];
    pooledAt?: string;
    lastContactAt?: string;
    tenant: ITenantRef;
    customer?: { id: number; name?: string; email?: string };
    propertyOfInterest?: IPropertyRef;
    responsible?: { id: number; login: string };
}

/**
 * Lead as returned by the operational-account list endpoint `GET /api/leads`
 * (Manager/Agent area). Same shape as {@link IPublicLeadResponse} plus the optional
 * geocoded point of interest. The backend enforces visibility by role — a Manager
 * gets every lead of the tenant, an Agent only the ones assigned to them — so the
 * front just renders whatever it receives.
 */
export interface ILeadDTO extends IPublicLeadResponse {
    latitude?: number;
    longitude?: number;
}

/**
 * Self-register flow: visitor creates a real login.
 * Backend creates User + Customer + Membership(leadStatus=NEW) in one
 * transactional unit. The front then calls /api/site/authenticate to obtain
 * the JWT (this endpoint returns the persisted entities, not the token).
 *
 * Endpoint: POST /api/site/register (public)
 * Conflict: email already in use → 409, errorKey "userexists" or "emailexists";
 *           front switches to the Entrar tab with email pre-filled.
 */
export interface ICustomerRegistrationRequest {
    /** Login name; we mirror the email for simplicity. */
    login: string;
    email: string;
    password: string;
    /** "pt-br" by default — matches the site's i18n. */
    langKey: string;
    customer: {
        name: string;
        phoneNumber: string;
        whatsapp?: string;
        personType: PersonType;
        naturalPersonDocument?: string;
        entityDocument?: string;
        postalCode?: string;
        streetName?: string;
        number?: string;
        complement?: string;
        /** Geocoded point of the address picked on the map. */
        latitude?: number;
        longitude?: number;
    };
    /** Required true. Backend timestamps termsAndConditionsAccept on the Membership. */
    acceptTerms: true;
    /**
     * Consent to be contacted by the tenant. When true, the backend also creates the
     * CustomerMembership (lead, leadStatus=NEW). When false/omitted, only the account
     * is created and `memberships` comes back empty. Replaces the old `createMembership`.
     */
    acceptContact?: boolean;
}

export interface ICustomerRegistrationResponse {
    customer: ICustomer;
    /** May include memberships auto-attached by autoConvertOnCustomerCreated. */
    memberships: ICustomerMembership[];
}

/**
 * Per-tenant Terms & Conditions text shown on the cross-tenant consent gate.
 * Configured by the agency in the hub; surfaced verbatim to the customer.
 * `text` is treated as plaintext (front uses `whitespace-pre-wrap`, no
 * markdown/HTML rendering — avoids XSS from tenant-owned content).
 */
export interface ITermsAndConditions {
    text: string;
    version?: string | null;
    updatedAt?: string | null;
}

/**
 * Tenant context for a logged-in Customer. The `memberOfCurrentTenant` flag
 * tells the front whether the customer already accepted data sharing with
 * the tenant the site is bound to. When `false`, the customer is logged-in
 * but cross-tenant — the UI must gate the authenticated area behind a
 * consent screen that calls `POST /api/site/memberships`.
 *
 * `termsAndConditions` is populated by the back when the gate is going to be
 * shown (memberOfCurrentTenant=false). When absent, the front falls back to
 * a generic copy.
 */
export interface ICurrentTenantInfo {
    id: number;
    name: string;
    slug: string;
    memberOfCurrentTenant: boolean;
    termsAndConditions?: ITermsAndConditions;
}

/**
 * Polymorphic response of `GET /api/site/me`. The `role` field discriminates
 * which profile is populated:
 *  - CUSTOMER → `customer` + `memberships` + `currentTenant`
 *  - MANAGER  → `manager`
 *  - AGENT    → `agent`
 *  - USER     → none (token without site-side role; unlikely)
 *
 * `@JsonInclude(NON_NULL)` on the back means absent fields are *omitted*
 * from the payload, not sent as `null`.
 *
 * Endpoint: GET /api/site/me (authenticated)
 */
export interface IMyAccountResponse {
    user: IUser;
    role: SiteRole;
    customer?: ICustomer;
    memberships?: ICustomerMembership[];
    manager?: IManager;
    agent?: IRealEstateAgent;
    /** Only present when role === 'CUSTOMER'. */
    currentTenant?: ICurrentTenantInfo;
}

/**
 * Body of `POST /api/site/memberships` — cross-tenant consent. Backend
 * rejects (400 with `errorKey: "consentrequired"`) when `acceptDataSharing`
 * is missing or false. `termsVersion` mirrors the version the front rendered
 * (from `currentTenant.termsAndConditions.version`) so the back can record
 * exactly which version the customer agreed to — useful for re-prompt when
 * the agency updates the document.
 */
export interface IMembershipAcceptRequest {
    acceptDataSharing: true;
    termsVersion?: string | null;
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

/**
 * InterestProfile: optional buyer profile attached to the logged-in Customer.
 * Sent after register+authenticate so the JWT is available.
 *
 * Endpoint: POST /api/site/interest-profiles (authenticated, aud="site")
 *
 * Field names mirror the backend's InterestProfileDTO verbatim (singular
 * `bedroom`/`suite`/`bathroom`, `carVacancy`, `utilArea`, `propertyBusinessType`).
 */
/**
 * Every field is optional — it's a search profile. Fields are `?: T | null` to mirror the
 * backend's nullable columns and to accept the form's output verbatim (the edit form yields
 * `null` for cleared fields and round-trips the `null`s the backend returns).
 */
export interface IInterestProfileRequest {
    title?: string | null;
    propertyType?: PropertyType | null;
    propertyBusinessType?: PropertyBusinessType | null;
    minAmount?: number | null;
    maxAmount?: number | null;
    bedroom?: number | null;
    suite?: number | null;
    bathroom?: number | null;
    carVacancy?: number | null;
    totalArea?: number | null;
    utilArea?: number | null;
    /** Free-text fallback for extra notes. */
    notes?: string | null;
    /** Point of interest on the map (signed) — guides the broker, not the person's address. */
    latitude?: number | null;
    longitude?: number | null;
    /**
     * Geography captured from the Google map by NAME (never typed). The service nests these into
     * `neighborhood → city → state → country` and the backend find-or-creates the records.
     */
    neighborhoodName?: string | null;
    cityName?: string | null;
    stateName?: string | null;
    uf?: string | null;
    countryName?: string | null;
    countryCode?: string | null;
}

export interface IInterestProfileResponse {
    id: number;
}

/**
 * Full InterestProfile as returned by `GET /api/site/interest-profiles` (the customer's own
 * saved profiles in the current tenant) and `PUT /api/site/interest-profiles/{id}`. Geography
 * comes back as `{ id, name }` projections.
 */
export interface IInterestProfileDTO {
    id: number;
    title?: string;
    propertyType?: PropertyType;
    propertyBusinessType?: PropertyBusinessType;
    minAmount?: number;
    maxAmount?: number;
    bedroom?: number;
    suite?: number;
    bathroom?: number;
    carVacancy?: number;
    totalArea?: number;
    utilArea?: number;
    notes?: string;
    latitude?: number;
    longitude?: number;
    state?: { id: number; name?: string; uf?: string };
    city?: { id: number; name?: string };
    neighborhood?: { id: number; name?: string };
}
