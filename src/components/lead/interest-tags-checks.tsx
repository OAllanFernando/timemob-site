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
import { Checkbox } from '@/components/ui/checkbox';

import { INTEREST_TAGS, type LeadInput } from '@/lib/schemas/lead';

interface Props {
    control: Control<LeadInput>;
}

export function InterestTagsChecks({ control }: Props) {
    const t = useTranslations('lead.fields');

    return (
        <FormField
            control={control}
            name="interestTags"
            render={({ field }) => {
                const selected = new Set(field.value ?? []);
                function toggle(tag: string, checked: boolean) {
                    const next = new Set(selected);
                    if (checked) next.add(tag);
                    else next.delete(tag);
                    field.onChange(Array.from(next));
                }
                return (
                    <FormItem>
                        <FormLabel>{t('interestTags')}</FormLabel>
                        <FormControl>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                {INTEREST_TAGS.map((tag) => (
                                    <label
                                        key={tag}
                                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-primary/40"
                                    >
                                        <Checkbox
                                            checked={selected.has(tag)}
                                            onCheckedChange={(checked) =>
                                                toggle(tag, checked === true)
                                            }
                                        />
                                        {tag}
                                    </label>
                                ))}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
}
