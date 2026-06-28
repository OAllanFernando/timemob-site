'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AdvancedMarker,
    APIProvider,
    InfoWindow,
    Map,
    Pin,
    useMap,
} from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';

import type { IPropertyMapMarker } from '@/types/customer';

interface LeadPoint {
    latitude?: number | null;
    longitude?: number | null;
    label?: string;
}

interface Props {
    lead: LeadPoint;
    properties: IPropertyMapMarker[];
}

const FALLBACK_CENTER = { lat: -14.2350044, lng: -51.9252815 };

/**
 * Read-only map cross-referencing the lead's point of interest (red pin) with the tenant's nearby
 * properties (blue pins), so the broker sees matching inventory. Clicking a property shows price/type.
 */
export function PropertiesMap({ lead, properties }: Props) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    if (!apiKey) {
        return (
            <div className="flex h-full items-center justify-center rounded-md border p-4 text-sm text-destructive">
                Google Maps API key não configurada.
            </div>
        );
    }
    return (
        <APIProvider apiKey={apiKey}>
            <MapBody lead={lead} properties={properties} />
        </APIProvider>
    );
}

function MapBody({ lead, properties }: Props) {
    const t = useTranslations('pages.leads.detail.map');
    const [selected, setSelected] = useState<IPropertyMapMarker | null>(null);

    const leadPoint = useMemo(
        () =>
            lead.latitude != null && lead.longitude != null
                ? { lat: lead.latitude, lng: lead.longitude }
                : null,
        [lead.latitude, lead.longitude],
    );

    const propPoints = useMemo(
        () => properties.filter((p) => p.latitude != null && p.longitude != null),
        [properties],
    );

    const allPoints = useMemo(() => {
        const pts: { lat: number; lng: number }[] = [];
        if (leadPoint) pts.push(leadPoint);
        propPoints.forEach((p) => pts.push({ lat: p.latitude as number, lng: p.longitude as number }));
        return pts;
    }, [leadPoint, propPoints]);

    return (
        <div className="h-full w-full overflow-hidden rounded-md border">
            <Map
                defaultCenter={leadPoint ?? FALLBACK_CENTER}
                defaultZoom={leadPoint ? 14 : 4}
                mapId="timemob-lead-properties-map"
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
            >
                <FitBounds points={allPoints} />

                {leadPoint && (
                    <AdvancedMarker position={leadPoint} title={lead.label ?? ''}>
                        <Pin background="#ef4444" borderColor="#b91c1c" glyphColor="#ffffff" />
                    </AdvancedMarker>
                )}

                {propPoints.map((p) => (
                    <AdvancedMarker
                        key={p.id}
                        position={{ lat: p.latitude as number, lng: p.longitude as number }}
                        onClick={() => setSelected(p)}
                    >
                        <Pin background="#2563eb" borderColor="#1e40af" glyphColor="#ffffff" />
                    </AdvancedMarker>
                ))}

                {selected && selected.latitude != null && selected.longitude != null && (
                    <InfoWindow
                        position={{ lat: selected.latitude, lng: selected.longitude }}
                        onCloseClick={() => setSelected(null)}
                    >
                        <div className="space-y-0.5 text-xs text-gray-900">
                            <p className="font-medium">{selected.title || t('untitled')}</p>
                            <p>{markerSummary(selected)}</p>
                        </div>
                    </InfoWindow>
                )}
            </Map>
        </div>
    );
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
    const map = useMap();
    useEffect(() => {
        if (!map || points.length === 0) return;
        if (points.length === 1) {
            map.panTo(points[0]);
            map.setZoom(15);
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 64);
    }, [map, points]);
    return null;
}

function markerSummary(p: IPropertyMapMarker): string {
    return [
        p.propertyType,
        p.amount
            ? p.amount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
              })
            : null,
        p.bedroom ? `${p.bedroom} dorm.` : null,
    ]
        .filter(Boolean)
        .join(' · ');
}
