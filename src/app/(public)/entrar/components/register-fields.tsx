'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';

import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

import type { RegisterInput } from '@/lib/schemas/register';

interface Props {
    control: Control<RegisterInput>;
    includePasswordFields?: boolean;
}

export function RegisterFields({ control, includePasswordFields = true }: Props) {
    const t = useTranslations('auth.register');

    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('fields.name')}</FormLabel>
                        <FormControl>
                            <Input autoComplete="name" placeholder={t('fields.namePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.email')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    autoComplete="email"
                                    placeholder={t('fields.emailPlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.phone')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder={t('fields.phonePlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={control}
                name="naturalPersonDocument"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('fields.cpf')}{' '}
                            <span className="text-xs text-muted-foreground">({t('fields.optional')})</span>
                        </FormLabel>
                        <FormControl>
                            <Input
                                inputMode="numeric"
                                placeholder={t('fields.cpfPlaceholder')}
                                {...field}
                                value={field.value ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {includePasswordFields && (
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fields.password')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder={t('fields.passwordPlaceholder')}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    {t('fields.passwordHint')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fields.confirmPassword')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder={t('fields.passwordPlaceholder')}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
            <FormField
                control={control}
                name="acceptTerms"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                        <FormControl>
                            <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-tight">
                            <FormLabel className="text-sm font-normal text-foreground">
                                {t('fields.acceptTerms')}{' '}
                                <Link
                                    href="/termos"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {t('fields.termsLink')}
                                </Link>
                            </FormLabel>
                            <FormMessage />
                        </div>
                    </FormItem>
                )}
            />
        </div>
    );
}
