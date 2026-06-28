'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { propertyService } from '@/services/property-service';
import type { PropertyInput } from '@/lib/schemas/property';
import type { IPropertyInput, IPropertyNeighborhood } from '@/types/property';

export const PROPERTIES_KEY = ['site', 'properties'] as const;
const PROPERTY_KEY = (id: number) => ['site', 'property', id] as const;
const PHOTOS_KEY = (id: number) => ['site', 'property', id, 'photos'] as const;

/** Build the nested geography the backend resolves by name — only when the address is complete. */
function buildNeighborhood(input: PropertyInput): IPropertyNeighborhood | null {
    if (!input.neighborhoodName || !input.cityName || !input.stateName || !input.countryName) {
        return null;
    }
    return {
        name: input.neighborhoodName,
        city: {
            name: input.cityName,
            state: {
                name: input.stateName,
                uf: input.uf,
                country: { name: input.countryName, code: input.countryCode },
            },
        },
    };
}

/** Maps flat form values to the backend write payload. Tenant is never sent (resolved server-side). */
export function toPropertyPayload(input: PropertyInput): IPropertyInput {
    return {
        title: input.title ?? null,
        description: input.description ?? null,
        amount: input.amount,
        propertyBusinessType: input.propertyBusinessType,
        propertyType: input.propertyType,
        propertyStatus: input.propertyStatus,
        featured: input.featured,

        postalCode: input.postalCode ?? null,
        streetName: input.streetName ?? null,
        number: input.number ?? null,
        condominium: input.condominium ?? null,
        tower: input.tower ?? null,
        lot: input.lot ?? null,
        neighborhood: buildNeighborhood(input),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        solarOrientation: input.solarOrientation ?? null,
        propertyPosition: input.propertyPosition ?? null,
        beachDistance: input.beachDistance ?? null,

        condominiumTax: input.condominiumTax ?? null,
        iptuAmount: input.iptuAmount ?? null,
        expectedCommissionPercentage: input.expectedCommissionPercentage ?? null,
        featuredCommissionPercentage: input.featuredCommissionPercentage ?? null,

        bedroom: input.bedroom ?? null,
        suite: input.suite ?? null,
        bathroom: input.bathroom ?? null,
        carVacancy: input.carVacancy ?? null,
        totalArea: input.totalArea ?? null,
        utilArea: input.utilArea ?? null,
        differentials: input.differentials ?? null,

        exclusive: input.exclusive ?? null,
        homeShow: input.homeShow ?? null,
        visitResponsibleName: input.visitResponsibleName ?? null,
        visitResponsiblePhoneNumber: input.visitResponsiblePhoneNumber ?? null,
        expectedVisitDurationMinutes: input.expectedVisitDurationMinutes ?? null,
    };
}

export function useMyProperties() {
    return useQuery({
        queryKey: PROPERTIES_KEY,
        queryFn: async () => (await propertyService.listMine()).data,
        staleTime: 30 * 1000,
    });
}

export function useMyProperty(id: number | null | undefined) {
    return useQuery({
        queryKey: PROPERTY_KEY(id ?? -1),
        queryFn: async () => (await propertyService.getById(id as number)).data,
        enabled: id != null,
    });
}

export function useCreateProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: PropertyInput) => propertyService.create(toPropertyPayload(input)),
        onSuccess: () => {
            toast.success('Imóvel cadastrado');
            queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
        },
        onError: (err: Error) => toast.error(err.message || 'Não foi possível cadastrar o imóvel'),
    });
}

export function useUpdateProperty(id: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: PropertyInput) => propertyService.update(id, toPropertyPayload(input)),
        onSuccess: () => {
            toast.success('Imóvel atualizado');
            queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
            queryClient.invalidateQueries({ queryKey: PROPERTY_KEY(id) });
        },
        onError: (err: Error) => toast.error(err.message || 'Não foi possível atualizar o imóvel'),
    });
}

export function useDeleteProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => propertyService.remove(id),
        onSuccess: () => {
            toast.success('Imóvel removido');
            queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
        },
        onError: (err: Error) => toast.error(err.message || 'Não foi possível remover o imóvel'),
    });
}

export function usePropertyPhotos(id: number | null | undefined) {
    return useQuery({
        queryKey: PHOTOS_KEY(id ?? -1),
        queryFn: async () => (await propertyService.listPhotos(id as number)).data,
        enabled: id != null,
    });
}

export function useUploadPhoto(id: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => propertyService.uploadPhoto(id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHOTOS_KEY(id) });
            queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
        },
        onError: (err: Error) => toast.error(err.message || 'Não foi possível enviar a foto'),
    });
}

export function useDeletePhoto(id: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaId: number) => propertyService.deletePhoto(id, mediaId),
        onSuccess: () => {
            toast.success('Foto removida');
            queryClient.invalidateQueries({ queryKey: PHOTOS_KEY(id) });
            queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
        },
        onError: (err: Error) => toast.error(err.message || 'Não foi possível remover a foto'),
    });
}
