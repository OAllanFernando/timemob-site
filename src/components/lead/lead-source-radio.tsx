'use client';

import { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { LEAD_SOURCES, type LeadInput } from '@/lib/schemas/lead';

interface Props {
    control: Control<LeadInput>;
}

export function LeadSourceRadio({ control }: Props) {
    const t = useTranslations('lead.sources');
    const tField = useTranslations('lead.fields');

    return (
        <FormField
            control={control}
            name="source"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{tField('source')}</FormLabel>
                    <FormControl>
                        <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex flex-col gap-2"
                        >
                            {LEAD_SOURCES.map((source) => (
                                <label
                                    key={source}
                                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3 text-sm hover:border-primary/40"
                                >
                                    <RadioGroupItem value={source} className="mt-0.5" />
                                    <span className="leading-tight text-foreground">
                                        {t(source)}
                                    </span>
                                </label>
                            ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
