import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse } from '@/lib/api/response';
import type { DomainResponse } from '@/types/domain-response';
import type {
    ICitySummary,
    INeighborhood,
    IStateSummary,
} from '@/types/location';

const PAGE_SIZE = 200;
const SORT_BY_NAME = 'name,asc';

/**
 * Read-only geography listings used by the location pickers. The site reuses the
 * shared `/hub/list` endpoints (states, cities, neighborhoods): they require only
 * ROLE_USER — which site customers also carry — and are not hub-only paths, so a
 * site-audience token is accepted by the backend audience filter.
 */
class LocationService {
    async listStates(countryId = 1): Promise<DomainResponse<IStateSummary[]>> {
        try {
            return toResponse(
                await api.get<IStateSummary[]>('/states/hub/list', {
                    params: {
                        'countryId.equals': countryId,
                        size: PAGE_SIZE,
                        sort: SORT_BY_NAME,
                    },
                }),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }

    async listCities(stateId: number): Promise<DomainResponse<ICitySummary[]>> {
        try {
            return toResponse(
                await api.get<ICitySummary[]>('/cities/hub/list', {
                    params: {
                        'stateId.equals': stateId,
                        size: PAGE_SIZE,
                        sort: SORT_BY_NAME,
                    },
                }),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }

    async listNeighborhoods(
        cityId: number,
    ): Promise<DomainResponse<INeighborhood[]>> {
        try {
            return toResponse(
                await api.get<INeighborhood[]>('/neighborhoods/hub/list', {
                    params: {
                        'cityId.equals': cityId,
                        size: PAGE_SIZE,
                        sort: SORT_BY_NAME,
                    },
                }),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }
}

export const locationService = new LocationService();
