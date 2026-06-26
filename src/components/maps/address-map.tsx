'use client';

import { useEffect } from 'react';
import {
    AdvancedMarker,
    Map,
    type MapMouseEvent,
    useMap,
} from '@vis.gl/react-google-maps';

interface Props {
    center: { lat: number; lng: number } | null;
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    mapId?: string;
}

const DEFAULT_CENTER = { lat: -14.2350044, lng: -51.9252815 };

export function AddressMap({ center, onLocationSelect, mapId }: Props) {
    const map = useMap();

    useEffect(() => {
        if (!map || !center) return;
        map.panTo(center);
        map.setZoom(17);
    }, [center, map]);

    const effectiveCenter = center ?? DEFAULT_CENTER;
    const zoom = center ? 17 : 4;

    function handleMapClick(ev: MapMouseEvent) {
        const latLng = ev.detail.latLng;
        if (latLng) onLocationSelect(latLng);
    }

    return (
        <div
            className="w-full overflow-hidden rounded-md border"
            style={{ height: 256 }}
        >
            <Map
                defaultCenter={effectiveCenter}
                defaultZoom={zoom}
                mapId={mapId ?? 'timemob-address-map'}
                gestureHandling="greedy"
                disableDefaultUI={false}
                onClick={handleMapClick}
                style={{ width: '100%', height: '100%' }}
            >
                {center && (
                    <AdvancedMarker
                        position={center}
                        draggable
                        onDragEnd={(e) => {
                            const lat = e.latLng?.lat();
                            const lng = e.latLng?.lng();
                            if (lat != null && lng != null) {
                                onLocationSelect({ lat, lng });
                            }
                        }}
                    />
                )}
            </Map>
        </div>
    );
}
