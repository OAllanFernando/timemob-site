'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    AdvancedMarker,
    APIProvider,
    Map,
    useMap,
    useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { MapPin, Search } from 'lucide-react';

import { parseAddressComponents } from '@/lib/maps/google-maps';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface DetectedNeighborhood {
    name: string;
    lat: number;
    lng: number;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialCenter: { lat: number; lng: number } | null;
    expectedCityName?: string | null;
    onSelect: (neighborhood: DetectedNeighborhood) => void;
}

/**
 * Map-based neighborhood picker (ported from the hub): when Google doesn't return a neighborhood
 * for the picked point, the customer drags/clicks a marker and each move reverse-geocodes the
 * point to detect the neighborhood. The neighborhood is determined purely by location — never typed.
 */
export function NeighborhoodPickerDialog({
    open,
    onOpenChange,
    initialCenter,
    expectedCityName,
    onSelect,
}: Props) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col gap-0 overflow-hidden p-0"
                style={{
                    maxHeight: 'calc(100dvh - 2rem)',
                    maxWidth: '56rem',
                    width: 'calc(100vw - 2rem)',
                }}
            >
                {apiKey ? (
                    <APIProvider apiKey={apiKey} libraries={['places', 'geocoding']}>
                        <PickerBody
                            initialCenter={initialCenter}
                            expectedCityName={expectedCityName ?? null}
                            onConfirm={(picked) => {
                                onSelect(picked);
                                onOpenChange(false);
                            }}
                            onCancel={() => onOpenChange(false)}
                        />
                    </APIProvider>
                ) : (
                    <div className="p-4 text-sm text-destructive">
                        Google Maps API key não configurada.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface BodyProps {
    initialCenter: { lat: number; lng: number } | null;
    expectedCityName: string | null;
    onConfirm: (n: DetectedNeighborhood) => void;
    onCancel: () => void;
}

function PickerBody({ initialCenter, expectedCityName, onConfirm, onCancel }: BodyProps) {
    const t = useTranslations('maps.neighborhoodPicker');
    const geocoding = useMapsLibrary('geocoding');
    const geocoder = useMemo(
        () => (geocoding ? new geocoding.Geocoder() : null),
        [geocoding],
    );

    const fallbackCenter = { lat: -14.2350044, lng: -51.9252815 };
    const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(initialCenter);
    const [detected, setDetected] = useState<{ name: string; cityMatch: boolean | null } | null>(
        null,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function runGeocode(loc: { lat: number; lng: number }) {
        if (!geocoder) return;
        setLoading(true);
        setError(null);
        try {
            const res = await geocoder.geocode({ location: loc });
            const result = res.results[0];
            if (!result) {
                setDetected(null);
                setError(t('nothingHere'));
                return;
            }
            const parsed = parseAddressComponents(
                result.address_components,
                result.formatted_address ?? '',
                loc,
            );
            if (!parsed.neighborhoodName) {
                setDetected(null);
                setError(t('noNeighborhoodHere'));
                return;
            }
            const cityMatch = expectedCityName
                ? parsed.cityName.toLowerCase().trim() === expectedCityName.toLowerCase().trim()
                : null;
            setDetected({ name: parsed.neighborhoodName, cityMatch });
        } catch {
            setDetected(null);
            setError(t('geocodeFailed'));
        } finally {
            setLoading(false);
        }
    }

    function handlePick(loc: { lat: number; lng: number }) {
        setMarker(loc);
        void runGeocode(loc);
    }

    const canConfirm = !!detected && !!marker;

    return (
        <>
            <DialogHeader className="border-b p-4">
                <DialogTitle>{t('title')}</DialogTitle>
                <DialogDescription>{t('description')}</DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
                <div className="overflow-hidden rounded-md border" style={{ height: 420 }}>
                    <Map
                        defaultCenter={marker ?? fallbackCenter}
                        defaultZoom={marker ? 16 : 4}
                        mapId="timemob-neighborhood-picker-map"
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        onClick={(ev) => {
                            const ll = ev.detail.latLng;
                            if (ll) handlePick(ll);
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <FocusOnMarker marker={marker} />
                        {marker && (
                            <AdvancedMarker
                                position={marker}
                                draggable
                                onDragEnd={(e) => {
                                    const lat = e.latLng?.lat();
                                    const lng = e.latLng?.lng();
                                    if (lat != null && lng != null) handlePick({ lat, lng });
                                }}
                            />
                        )}
                    </Map>
                </div>

                <div className="rounded-md border bg-card p-3 text-sm">
                    {loading && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                            <Search className="size-3.5 animate-pulse" />
                            {t('searching')}
                        </p>
                    )}

                    {!loading && detected && (
                        <div className="space-y-1">
                            <p className="flex items-center gap-2">
                                <MapPin className="size-4 text-primary" />
                                <span className="font-medium">{detected.name}</span>
                            </p>
                            {detected.cityMatch === false && (
                                <p className="text-xs text-amber-600 dark:text-amber-500">
                                    {t('cityMismatch', { city: expectedCityName ?? '' })}
                                </p>
                            )}
                        </div>
                    )}

                    {!loading && !detected && error && (
                        <p className="text-xs text-muted-foreground">{error}</p>
                    )}

                    {!loading && !detected && !error && (
                        <p className="text-xs text-muted-foreground">{t('helper')}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t bg-muted/30 p-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('cancel')}
                </Button>
                <Button
                    type="button"
                    disabled={!canConfirm}
                    onClick={() => {
                        if (!detected || !marker) return;
                        onConfirm({ name: detected.name, lat: marker.lat, lng: marker.lng });
                    }}
                >
                    {t('confirm')}
                </Button>
            </div>
        </>
    );
}

function FocusOnMarker({ marker }: { marker: { lat: number; lng: number } | null }) {
    const map = useMap();
    const focusedRef = useRef(false);

    useEffect(() => {
        if (!map || !marker || focusedRef.current) return;
        focusedRef.current = true;
        map.panTo(marker);
        map.setZoom(16);
    }, [map, marker]);

    return null;
}
