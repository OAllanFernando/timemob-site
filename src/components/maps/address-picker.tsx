'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { LocateFixed, MapPin } from 'lucide-react';

import { requestUserLocation } from '@/lib/maps/geolocation';
import { parseAddressComponents, type ResolvedAddress } from '@/lib/maps/google-maps';
import { Button } from '@/components/ui/button';

import { AddressMap } from './address-map';
import { PlaceAutocomplete } from './place-autocomplete';

export interface AddressPickerTexts {
    search: string;
    searchPlaceholder: string;
    useMyLocation: string;
    locating: string;
    geoDenied: string;
    geoBlocked: string;
    geoUnavailable: string;
    hint: string;
}

const DEFAULT_TEXTS: AddressPickerTexts = {
    search: 'Buscar endereço',
    searchPlaceholder: 'Digite rua, bairro ou cidade…',
    useMyLocation: 'Usar minha localização',
    locating: 'Localizando…',
    geoDenied: 'Não foi possível obter sua localização. Tente de novo ou clique no mapa para marcar.',
    geoBlocked:
        'A permissão de localização está bloqueada para este site. Reative pelo ícone de cadeado/localização na barra de endereço do navegador e tente de novo — ou clique no mapa para marcar.',
    geoUnavailable: 'Seu navegador não suporta geolocalização. Clique no mapa.',
    hint: 'Clique no mapa ou arraste o pino para ajustar o ponto.',
};

interface Props {
    /** Current point, if any — drives the map pin. */
    value: { latitude: number | null; longitude: number | null };
    /** Fired with the resolved address (incl. lat/lng) on any selection. */
    onChange: (address: ResolvedAddress) => void;
    /** When true, prompts the browser for geolocation on mount (lead flow). */
    promptOnMount?: boolean;
    /** Hide the Places search box (point-only flows). */
    showSearch?: boolean;
    texts?: Partial<AddressPickerTexts>;
}

export function AddressPicker(props: Props) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    const texts = { ...DEFAULT_TEXTS, ...props.texts };

    if (!apiKey) {
        // No user-facing error: just hide the picker. Devs get a console hint.
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                '[AddressPicker] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ausente — seletor de endereço oculto.',
            );
        }
        return null;
    }

    return (
        <APIProvider apiKey={apiKey} libraries={['places', 'geocoding']}>
            <AddressPickerBody {...props} texts={texts} />
        </APIProvider>
    );
}

function AddressPickerBody({
    value,
    onChange,
    promptOnMount = false,
    showSearch = true,
    texts,
}: Props & { texts: AddressPickerTexts }) {
    const geocoding = useMapsLibrary('geocoding');
    const geocoder = useMemo(
        () => (geocoding ? new geocoding.Geocoder() : null),
        [geocoding],
    );

    const [userLocation, setUserLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [locating, setLocating] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const promptedRef = useRef(false);

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const mapCenter =
        value.latitude != null && value.longitude != null
            ? { lat: value.latitude, lng: value.longitude }
            : null;

    const applyResolved = useCallback(
        (place: {
            address_components?: google.maps.GeocoderAddressComponent[];
            geometry?: { location?: google.maps.LatLng };
            formatted_address?: string;
        }) => {
            const loc = place.geometry?.location;
            const resolved = parseAddressComponents(
                place.address_components,
                place.formatted_address ?? '',
                loc ? { lat: loc.lat(), lng: loc.lng() } : null,
            );
            onChangeRef.current(resolved);
        },
        [],
    );

    const handleLocationSelect = useCallback(
        async (loc: { lat: number; lng: number }) => {
            // Emit the point immediately so the pin lands even without geocoding.
            onChangeRef.current(
                parseAddressComponents([], '', { lat: loc.lat, lng: loc.lng }),
            );
            if (!geocoder) return;
            try {
                const res = await geocoder.geocode({ location: loc });
                const result = res.results[0];
                if (!result) return;
                applyResolved({
                    address_components: result.address_components,
                    geometry: result.geometry,
                    formatted_address: result.formatted_address,
                });
            } catch {
                // Keep the point; reverse-geocode is best-effort.
            }
        },
        [geocoder, applyResolved],
    );

    const triggerUserLocation = useCallback(async () => {
        setLocating(true);
        setGeoError(null);
        try {
            const { latitude, longitude } = await requestUserLocation();
            const loc = { lat: latitude, lng: longitude };
            setUserLocation(loc);
            await handleLocationSelect(loc);
        } catch (reason) {
            if (reason === 'unavailable') {
                setGeoError(texts.geoUnavailable);
            } else {
                // Browsers won't re-prompt after a hard denial — detect the
                // persistently-blocked state so we can tell the user to re-enable
                // it via the address-bar icon instead of silently failing.
                let blocked = false;
                try {
                    const status = await navigator.permissions?.query({
                        name: 'geolocation' as PermissionName,
                    });
                    blocked = status?.state === 'denied';
                } catch {
                    // Permissions API unavailable — fall back to the generic message.
                }
                setGeoError(blocked ? texts.geoBlocked : texts.geoDenied);
            }
        } finally {
            setLocating(false);
        }
    }, [handleLocationSelect, texts.geoBlocked, texts.geoDenied, texts.geoUnavailable]);

    // Lead flow: actively ask the visitor for their location once.
    useEffect(() => {
        if (!promptOnMount || promptedRef.current) return;
        promptedRef.current = true;
        void triggerUserLocation();
    }, [promptOnMount, triggerUserLocation]);

    return (
        <div className="space-y-3">
            <div className="flex items-end justify-between gap-2">
                {showSearch ? (
                    <span className="text-sm font-medium">{texts.search}</span>
                ) : (
                    <span />
                )}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={triggerUserLocation}
                    disabled={locating}
                >
                    <LocateFixed className="mr-1 size-3.5" />
                    {locating ? texts.locating : texts.useMyLocation}
                </Button>
            </div>

            {showSearch && (
                <div className="relative z-50 min-w-0">
                    <PlaceAutocomplete
                        placeholder={texts.searchPlaceholder}
                        onPlaceSelect={applyResolved}
                        biasCenter={userLocation}
                    />
                </div>
            )}

            {geoError && <p className="text-xs text-destructive">{geoError}</p>}

            <AddressMap center={mapCenter} onLocationSelect={handleLocationSelect} />

            {mapCenter ? (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}
                </p>
            ) : (
                <p className="text-xs text-muted-foreground">{texts.hint}</p>
            )}
        </div>
    );
}
