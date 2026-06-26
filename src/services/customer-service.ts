import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse, toPagedResponse } from '@/lib/api/response';
import type { DomainResponse, DomainPagedResponse } from '@/types/domain-response';
import type {
    ICustomerMembership,
    ICustomerRegistrationRequest,
    ICustomerRegistrationResponse,
    IInterestProfileDTO,
    IInterestProfileRequest,
    IInterestProfileResponse,
    ILeadDTO,
    IMembershipAcceptRequest,
    IMyAccountResponse,
    IPublicLeadRequest,
    IPublicLeadResponse,
    LeadStage,
} from '@/types/customer';

/**
 * Transforms the form-facing interest-profile request (geography by NAME) into the wire body the
 * backend expects: a nested `neighborhood → city → state → country` the backend find-or-creates.
 * Country defaults to Brasil/BR (BR-only platform). Geography is omitted when there's no neighborhood.
 */
function toInterestProfileApiBody(data: IInterestProfileRequest): Record<string, unknown> {
    const { neighborhoodName, cityName, stateName, uf, countryName, countryCode, ...rest } = data;
    const body: Record<string, unknown> = { ...rest };
    if (neighborhoodName && cityName && (stateName || uf)) {
        body.neighborhood = {
            name: neighborhoodName,
            city: {
                name: cityName,
                state: {
                    name: stateName || uf,
                    uf: uf ?? '',
                    country: { name: countryName || 'Brasil', code: countryCode || 'BR' },
                },
            },
        };
    }
    return body;
}

class CustomerService {
    async register(
        data: ICustomerRegistrationRequest,
    ): Promise<DomainResponse<ICustomerRegistrationResponse>> {
        try {
            return toResponse(
                await api.post<ICustomerRegistrationResponse>('/site/register', data),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }

    async getMe(): Promise<DomainResponse<IMyAccountResponse>> {
        try {
            return toResponse(await api.get<IMyAccountResponse>('/site/me'));
        } catch (err) {
            throw toDomainError(err);
        }
    }

    async submitLead(
        data: IPublicLeadRequest,
    ): Promise<DomainResponse<IPublicLeadResponse>> {
        try {
            return toResponse(await api.post<IPublicLeadResponse>('/site/leads', data));
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /**
     * Lists the leads of the current operational account (Manager/Agent area).
     * Hits `GET /api/leads` (NOT the public `/site/leads` capture path) — the JWT's
     * tenant + role drive scoping and visibility on the backend. Returns a paginated
     * envelope built from the `X-Total-Count`/`Link` response headers.
     */
    async listLeads(
        page = 0,
        size = 20,
        stage?: LeadStage,
    ): Promise<DomainPagedResponse<ILeadDTO>> {
        try {
            const params: Record<string, unknown> = { page, size };
            if (stage) params.stage = stage;
            return toPagedResponse(await api.get<ILeadDTO[]>('/leads', { params }));
        } catch (err) {
            throw toDomainError(err);
        }
    }

    async submitInterestProfile(
        data: IInterestProfileRequest,
    ): Promise<DomainResponse<IInterestProfileResponse>> {
        try {
            return toResponse(
                await api.post<IInterestProfileResponse>(
                    '/site/interest-profiles',
                    toInterestProfileApiBody(data),
                ),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /** The logged customer's own interest profiles in the current tenant. */
    async listMyInterestProfiles(): Promise<DomainResponse<IInterestProfileDTO[]>> {
        try {
            return toResponse(
                await api.get<IInterestProfileDTO[]>('/site/interest-profiles'),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }

    async updateInterestProfile(
        id: number,
        data: IInterestProfileRequest,
    ): Promise<DomainResponse<IInterestProfileDTO>> {
        try {
            return toResponse(
                await api.put<IInterestProfileDTO>(
                    `/site/interest-profiles/${id}`,
                    toInterestProfileApiBody(data),
                ),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }

    async acceptCurrentTenantMembership(
        termsVersion?: string | null,
    ): Promise<DomainResponse<ICustomerMembership>> {
        try {
            const body: IMembershipAcceptRequest = {
                acceptDataSharing: true,
                ...(termsVersion ? { termsVersion } : {}),
            };
            return toResponse(await api.post<ICustomerMembership>('/site/memberships', body));
        } catch (err) {
            throw toDomainError(err);
        }
    }
}

export const customerService = new CustomerService();
