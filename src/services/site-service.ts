import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse } from '@/lib/api/response';
import type { DomainResponse } from '@/types/domain-response';
import type { ISiteSetup } from '@/types/customer';

/**
 * Public white-label bootstrap for the current tenant's site. Resolved on the backend from the
 * `X-Tenant-Slug` header (sent by the axios interceptor), so this works for anonymous visitors on
 * the landing/login as well as signed-in users.
 */
class SiteService {
    async getSetup(): Promise<DomainResponse<ISiteSetup>> {
        try {
            return toResponse(await api.get<ISiteSetup>('/site/setup'));
        } catch (err) {
            throw toDomainError(err);
        }
    }
}

export const siteService = new SiteService();
