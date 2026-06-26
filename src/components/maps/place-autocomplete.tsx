'use client';

import { useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

type LegacyPlace = {
    address_components?: google.maps.GeocoderAddressComponent[];
    geometry?: { location?: google.maps.LatLng };
    formatted_address?: string;
};

interface Props {
    onPlaceSelect: (place: LegacyPlace) => void;
    placeholder?: string;
    biasCenter?: { lat: number; lng: number } | null;
    biasRadiusMeters?: number;
}

interface NewAddressComponent {
    longText?: string;
    shortText?: string;
    types?: string[];
}

interface GmpSelectEvent extends Event {
    placePrediction: {
        toPlace(): {
            fetchFields(opts: { fields: string[] }): Promise<void>;
            displayName?: string;
            formattedAddress?: string;
            addressComponents?: NewAddressComponent[];
            location?: google.maps.LatLng;
        };
    };
}

export function PlaceAutocomplete({
    onPlaceSelect,
    placeholder,
    biasCenter,
    biasRadiusMeters = 20000,
}: Props) {
    const places = useMapsLibrary('places');
    const containerRef = useRef<HTMLDivElement>(null);
    const onSelectRef = useRef(onPlaceSelect);

    useEffect(() => {
        onSelectRef.current = onPlaceSelect;
    });

    useEffect(() => {
        if (!places || !containerRef.current) return;

        const PlaceAutocompleteElement = (
            places as unknown as {
                PlaceAutocompleteElement: new (opts: {
                    includedRegionCodes?: string[];
                    locationBias?:
                        | google.maps.LatLngBoundsLiteral
                        | google.maps.CircleLiteral;
                }) => HTMLElement & {
                    placeholder?: string;
                    locationBias?:
                        | google.maps.LatLngBoundsLiteral
                        | google.maps.CircleLiteral;
                };
            }
        ).PlaceAutocompleteElement;

        const element = new PlaceAutocompleteElement({
            includedRegionCodes: ['br'],
            locationBias: biasCenter
                ? { center: biasCenter, radius: biasRadiusMeters }
                : undefined,
        });
        if (placeholder) element.placeholder = placeholder;
        element.style.width = '100%';
        element.style.maxWidth = '100%';
        element.style.boxSizing = 'border-box';
        element.style.display = 'block';

        const container = containerRef.current;
        container.innerHTML = '';
        container.appendChild(element);

        async function handleSelect(ev: Event) {
            const select = ev as GmpSelectEvent;
            const place = select.placePrediction.toPlace();
            await place.fetchFields({
                fields: [
                    'displayName',
                    'formattedAddress',
                    'addressComponents',
                    'location',
                ],
            });

            const components: google.maps.GeocoderAddressComponent[] = (
                place.addressComponents ?? []
            ).map((c) => ({
                long_name: c.longText ?? '',
                short_name: c.shortText ?? '',
                types: c.types ?? [],
            }));

            const location = place.location;
            onSelectRef.current({
                address_components: components,
                formatted_address: place.formattedAddress ?? '',
                geometry: location ? { location } : undefined,
            });
        }

        element.addEventListener('gmp-select', handleSelect);
        return () => {
            element.removeEventListener('gmp-select', handleSelect);
            if (container.contains(element)) container.removeChild(element);
        };
    }, [places, placeholder, biasCenter, biasRadiusMeters]);

    return <div ref={containerRef} className="w-full" />;
}
