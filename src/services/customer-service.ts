import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse } from '@/lib/api/response';
import type { DomainResponse } from '@/types/domain-response';
import type {
    ICustomerMembership,
    ICustomerRegistrationRequest,
    ICustomerRegistrationResponse,
    IInterestProfileRequest,
    IInterestProfileResponse,
    IMembershipAcceptRequest,
    IMyAccountResponse,
    IPublicLeadRequest,
    IPublicLeadResponse,
} from '@/types/customer';

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

    async submitInterestProfile(
        data: IInterestProfileRequest,
    ): Promise<DomainResponse<IInterestProfileResponse>> {
        try {
            return toResponse(
                await api.post<IInterestProfileResponse>('/site/interest-profiles', data),
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
