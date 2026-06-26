'use client';

import { useQuery } from '@tanstack/react-query';

import { locationService } from '@/services/location-service';

const HOUR = 60 * 60 * 1000;
const HALF_HOUR = 30 * 60 * 1000;

const STATES_KEY = (countryId: number) =>
    ['locations', 'states', countryId] as const;
const CITIES_KEY = (stateId: number) =>
    ['locations', 'cities', stateId] as const;
const NEIGHBORHOODS_KEY = (cityId: number) =>
    ['locations', 'neighborhoods', cityId] as const;

export function useStates(countryId = 1) {
    return useQuery({
        queryKey: STATES_KEY(countryId),
        queryFn: async () => {
            const res = await locationService.listStates(countryId);
            return res.data;
        },
        staleTime: HOUR,
    });
}

export function useCities(stateId: number | null | undefined) {
    return useQuery({
        queryKey: CITIES_KEY(stateId ?? -1),
        queryFn: async () => {
            const res = await locationService.listCities(stateId as number);
            return res.data;
        },
        enabled: stateId != null,
        staleTime: HALF_HOUR,
    });
}

export function useNeighborhoods(cityId: number | null | undefined) {
    return useQuery({
        queryKey: NEIGHBORHOODS_KEY(cityId ?? -1),
        queryFn: async () => {
            const res = await locationService.listNeighborhoods(cityId as number);
            return res.data;
        },
        enabled: cityId != null,
        staleTime: HALF_HOUR,
    });
}
