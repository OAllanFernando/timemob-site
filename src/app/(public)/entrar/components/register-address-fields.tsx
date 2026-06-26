'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AddressPicker } from '@/components/maps/address-picker';
import type { ResolvedAddress } from '@/lib/maps/google-maps';
import type { RegisterInput } from '@/lib/schemas/register';

interface Props {
    form: UseFormReturn<RegisterInput>;
}

export function RegisterAddressFields({ form }: Props) {
    const t = useTranslations('auth.register.address');

    const lat = form.watch('latitude');
    const lng = form.watch('longitude');

    function handleResolved(addr: ResolvedAddress) {
        form.setValue('latitude', addr.latitude, { shouldDirty: true });
        form.setValue('longitude', addr.longitude, { shouldDirty: true });
        if (addr.streetName) form.setValue('streetName', addr.streetName, { shouldDirty: true });
        if (addr.number) form.setValue('number', addr.number, { shouldDirty: true });
        if (addr.postalCode) form.setValue('postalCode', addr.postalCode, { shouldDirty: true });
    }

    return (
        <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
            <div>
                <p className="text-sm font-medium text-foreground">{t('title')}</p>
                <p className="text-xs text-muted-foreground">{t('hint')}</p>
            </div>

            <AddressPicker
                value={{ latitude: lat ?? null, longitude: lng ?? null }}
                onChange={handleResolved}
            />

            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <FormField
                    control={form.control}
                    name="streetName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('streetName')}</FormLabel>
                            <FormControl>
                                <Input autoComplete="address-line1" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('number')}</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('postalCode')}</FormLabel>
                            <FormControl>
                                <Input
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                    placeholder="00000-000"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('complement')}</FormLabel>
                            <FormControl>
                                <Input autoComplete="address-line2" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
