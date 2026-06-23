'use client';

import { useTranslations } from 'next-intl';
import type { Control, FieldPath } from 'react-hook-form';

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import {
    BUSINESS_TYPES,
    PROPERTY_TYPES,
    type InterestProfileInput,
} from '@/lib/schemas/interest-profile';

interface Props {
    control: Control<InterestProfileInput>;
}

type FieldName = FieldPath<InterestProfileInput>;

export function InterestProfileFields({ control }: Props) {
    const t = useTranslations('auth.interestProfile');

    return (
        <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('intro')}</p>

            <FormField
                control={control}
                name="propertyType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('fields.propertyType')}</FormLabel>
                        <FormControl>
                            <RadioGroup
                                value={field.value ?? ''}
                                onValueChange={field.onChange}
                                className="grid grid-cols-2 gap-2 md:grid-cols-3"
                            >
                                {PROPERTY_TYPES.map((type) => (
                                    <label
                                        key={type}
                                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-primary/40"
                                    >
                                        <RadioGroupItem value={type} />
                                        {t(`propertyTypes.${type}`)}
                                    </label>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="propertyBusinessType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('fields.businessType')}</FormLabel>
                        <FormControl>
                            <RadioGroup
                                value={field.value ?? ''}
                                onValueChange={field.onChange}
                                className="grid grid-cols-2 gap-2"
                            >
                                {BUSINESS_TYPES.map((type) => (
                                    <label
                                        key={type}
                                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-primary/40"
                                    >
                                        <RadioGroupItem value={type} />
                                        {t(`businessTypes.${type}`)}
                                    </label>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid gap-4 md:grid-cols-2">
                <NumberField control={control} name="minAmount" label={t('fields.minAmount')} />
                <NumberField control={control} name="maxAmount" label={t('fields.maxAmount')} />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <NumberField control={control} name="bedroom" label={t('fields.bedrooms')} />
                <NumberField control={control} name="suite" label={t('fields.suites')} />
                <NumberField control={control} name="bathroom" label={t('fields.bathrooms')} />
                <NumberField
                    control={control}
                    name="carVacancy"
                    label={t('fields.parkingSpots')}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <NumberField control={control} name="totalArea" label={t('fields.totalArea')} />
                <NumberField control={control} name="utilArea" label={t('fields.usefulArea')} />
            </div>

            <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('fields.notes')}</FormLabel>
                        <FormControl>
                            <Textarea
                                rows={3}
                                placeholder={t('fields.notesPlaceholder')}
                                {...field}
                                value={field.value ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

function NumberField({
    control,
    name,
    label,
}: {
    control: Control<InterestProfileInput>;
    name: FieldName;
    label: string;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={typeof field.value === 'number' ? field.value : ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(v === '' ? undefined : Number(v));
                            }}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            name={field.name}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
