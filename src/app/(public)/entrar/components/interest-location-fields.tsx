'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { MapPin } from 'lucide-react';

import { AddressPicker } from '@/components/maps/address-picker';
import { NeighborhoodPickerDialog } from '@/components/maps/neighborhood-picker-dialog';
import type { ResolvedAddress } from '@/lib/maps/google-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InterestProfileInput } from '@/lib/schemas/interest-profile';

interface Props {
    form: UseFormReturn<InterestProfileInput>;
}

/**
 * Location of interest for the search profile, captured the hub way: the customer picks a point on
 * the Google map (or autocomplete) and city/state/neighborhood are filled READ-ONLY from the
 * resolved address — never typed. When Google returns no neighborhood for the point, a map-based
 * neighborhood picker resolves it by location. Geography is persisted by name (backend find-or-create).
 */
export function InterestLocationFields({ form }: Props) {
    const t = useTranslations('auth.interestProfile.location');
    const [pickerOpen, setPickerOpen] = useState(false);

    // useWatch (not form.watch) so THIS child re-renders when the map callbacks setValue — form.watch
    // only re-renders the component that called useForm, which would leave the pin and the read-only
    // fields frozen here.
    const control = form.control;
    const lat = useWatch({ control, name: 'latitude' });
    const lng = useWatch({ control, name: 'longitude' });
    const neighborhoodName = useWatch({ control, name: 'neighborhoodName' });
    const cityName = useWatch({ control, name: 'cityName' });
    const stateName = useWatch({ control, name: 'stateName' });
    const uf = useWatch({ control, name: 'uf' });

    function applyResolved(addr: ResolvedAddress) {
        form.setValue('latitude', addr.latitude ?? undefined, { shouldDirty: true });
        form.setValue('longitude', addr.longitude ?? undefined, { shouldDirty: true });
        form.setValue('neighborhoodName', addr.neighborhoodName || undefined, { shouldDirty: true });
        form.setValue('cityName', addr.cityName || undefined, { shouldDirty: true });
        form.setValue('stateName', addr.stateName || undefined, { shouldDirty: true });
        form.setValue('uf', addr.uf || undefined, { shouldDirty: true });
        form.setValue('countryName', addr.countryName || undefined, { shouldDirty: true });
        form.setValue('countryCode', addr.countryCode || undefined, { shouldDirty: true });
    }

    const hasPoint = lat != null && lng != null;
    const neighborhoodEmpty = !neighborhoodName;

    return (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
            <div>
                <p className="text-sm font-medium text-foreground">{t('title')}</p>
                <p className="text-xs text-muted-foreground">{t('hint')}</p>
            </div>

            <AddressPicker
                value={{ latitude: lat ?? null, longitude: lng ?? null }}
                onChange={applyResolved}
            />

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <span className="text-sm">{t('city')}</span>
                    <Input
                        readOnly
                        tabIndex={-1}
                        className="cursor-not-allowed bg-muted/40"
                        value={cityName ?? ''}
                        placeholder={t('cityEmpty')}
                    />
                </div>
                <div className="space-y-1.5">
                    <span className="text-sm">{t('state')}</span>
                    <Input
                        readOnly
                        tabIndex={-1}
                        className="cursor-not-allowed bg-muted/40"
                        value={stateName ? (uf ? `${stateName} (${uf})` : stateName) : ''}
                        placeholder={t('stateEmpty')}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <span className="text-sm">{t('neighborhood')}</span>
                <div className="flex flex-wrap items-stretch gap-2">
                    <Input
                        readOnly
                        tabIndex={-1}
                        className="flex-1 cursor-not-allowed bg-muted/40"
                        value={neighborhoodName ?? ''}
                        placeholder={t('neighborhoodEmpty')}
                    />
                    <Button
                        type="button"
                        variant={neighborhoodEmpty ? 'default' : 'outline'}
                        size="sm"
                        disabled={!hasPoint}
                        onClick={() => setPickerOpen(true)}
                    >
                        <MapPin className="mr-1 size-3.5" />
                        {neighborhoodEmpty ? t('pickNeighborhood') : t('changeNeighborhood')}
                    </Button>
                </div>
                {neighborhoodEmpty && hasPoint && (
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                        {t('neighborhoodMissing')}
                    </p>
                )}
            </div>

            <NeighborhoodPickerDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                initialCenter={hasPoint ? { lat: lat as number, lng: lng as number } : null}
                expectedCityName={cityName ?? null}
                onSelect={({ name }) =>
                    form.setValue('neighborhoodName', name, {
                        shouldDirty: true,
                        shouldValidate: true,
                    })
                }
            />
        </div>
    );
}
