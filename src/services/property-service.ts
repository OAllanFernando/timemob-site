import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse } from '@/lib/api/response';
import type { DomainResponse } from '@/types/domain-response';
import type { IPropertyMapMarker } from '@/types/customer';

class PropertyService {
    /**
     * Tenant properties near a point (the lead's location), for the lead-detail map. Staff-only
     * (`/api/site/properties/nearby`, MANAGER/AGENT). With no coordinates the backend returns the
     * tenant's geocoded inventory.
     */
    async listNearby(
        latitude?: number | null,
        longitude?: number | null,
        radiusKm = 5,
    ): Promise<DomainResponse<IPropertyMapMarker[]>> {
        try {
            const params: Record<string, unknown> = { radiusKm };
            if (latitude != null && longitude != null) {
                params.latitude = latitude;
                params.longitude = longitude;
            }
            return toResponse(
                await api.get<IPropertyMapMarker[]>('/site/properties/nearby', { params }),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }
}

export const propertyService = new PropertyService();
