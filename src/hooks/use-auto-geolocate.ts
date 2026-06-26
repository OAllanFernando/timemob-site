'use client';

import { useEffect, useRef } from 'react';

import { requestUserLocation, type GeoResult } from '@/lib/maps/geolocation';

interface Options {
    skip: boolean;
    onLocated: (result: GeoResult) => void;
}

export function useAutoGeolocate({ skip, onLocated }: Options) {
    const triedRef = useRef(false);
    const onLocatedRef = useRef(onLocated);

    useEffect(() => {
        onLocatedRef.current = onLocated;
    }, [onLocated]);

    useEffect(() => {
        if (skip || triedRef.current) return;
        triedRef.current = true;

        if (typeof navigator === 'undefined' || !navigator.permissions) return;

        let cancelled = false;
        (async () => {
            try {
                const status = await navigator.permissions.query({
                    name: 'geolocation' as PermissionName,
                });
                if (cancelled || status.state !== 'granted') return;
                const result = await requestUserLocation();
                if (cancelled) return;
                onLocatedRef.current(result);
            } catch {
                // silencioso: sem permissão ou navegador sem suporte → não chateia
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [skip]);
}
