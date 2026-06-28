import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse } from '@/lib/api/response';
import type { DomainResponse, ISpringPage } from '@/types/domain-response';
import type { IPropertyMapMarker } from '@/types/customer';
import type { IMedia, IProperty, IPropertyInput, IPropertyListItem } from '@/types/property';

class PropertyService {
    /**
     * The agency's own inventory (`GET /api/site/properties`, MANAGER/AGENT, tenant-scoped). Returns
     * the page content; the backend serializes a Spring `Page`.
     */
    async listMine(): Promise<DomainResponse<IPropertyListItem[]>> {
        try {
            // `sort` binds to PropertyCriteria.sort (enum PropertySortKey), not Pageable — `recent` = newest first.
            const res = await api.get<ISpringPage<IPropertyListItem>>('/site/properties', {
                params: { size: 100, sort: 'recent' },
            });
            return { data: res.data.content ?? [], status: res.status };
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /** Full detail of an owned property, for the edit form (`GET /api/site/properties/{id}`). */
    async getById(id: number): Promise<DomainResponse<IProperty>> {
        try {
            return toResponse(await api.get<IProperty>(`/site/properties/${id}`));
        } catch (err) {
            throw toDomainError(err);
        }
    }
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

    /**
     * Register a property for the agency operating this site. Staff-only
     * (`POST /api/site/properties`, MANAGER/AGENT). Tenant is resolved server-side from the token.
     */
    async create(payload: IPropertyInput): Promise<DomainResponse<IProperty>> {
        try {
            return toResponse(await api.post<IProperty>('/site/properties', payload));
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /**
     * Update an owned property (`PUT /api/site/properties/{id}`, MANAGER/AGENT). The backend asserts
     * tenant/broker ownership and keeps the owning tenant immutable.
     */
    async update(id: number, payload: IPropertyInput): Promise<DomainResponse<IProperty>> {
        try {
            return toResponse(await api.put<IProperty>(`/site/properties/${id}`, { ...payload, id }));
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /** Delete an owned property (`DELETE /api/site/properties/{id}`, MANAGER/AGENT). */
    async remove(id: number): Promise<DomainResponse<void>> {
        try {
            return toResponse(await api.delete<void>(`/site/properties/${id}`));
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /** Active photos of an owned property (`GET /api/site/properties/{id}/media`). */
    async listPhotos(propertyId: number): Promise<DomainResponse<IMedia[]>> {
        try {
            return toResponse(await api.get<IMedia[]>(`/site/properties/${propertyId}/media`));
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /** Upload a photo (`POST /api/site/properties/{id}/media`, multipart). Bytes go to S3. */
    async uploadPhoto(propertyId: number, file: File): Promise<DomainResponse<IMedia>> {
        try {
            const form = new FormData();
            form.append('file', file);
            return toResponse(
                await api.post<IMedia>(`/site/properties/${propertyId}/media`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }),
            );
        } catch (err) {
            throw toDomainError(err);
        }
    }

    /** Remove a photo (`DELETE /api/site/properties/{id}/media/{mediaId}`, soft delete). */
    async deletePhoto(propertyId: number, mediaId: number): Promise<DomainResponse<void>> {
        try {
            return toResponse(await api.delete<void>(`/site/properties/${propertyId}/media/${mediaId}`));
        } catch (err) {
            throw toDomainError(err);
        }
    }
}

export const propertyService = new PropertyService();
