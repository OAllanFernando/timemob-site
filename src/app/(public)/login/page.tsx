'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DomainError } from '@/types/domain-response';

type ErrorCode = 'invalidCredentials' | 'network' | 'unknown';

function resolveErrorCode(err: unknown): ErrorCode {
    if (err instanceof DomainError) {
        if (err.code === 'network') return 'network';
        if (err.code === 'unauthorized' || err.status === 400 || err.status === 401) {
            return 'invalidCredentials';
        }
    }
    return 'unknown';
}

export default function LoginPage() {
    const t = useTranslations('auth.login');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, authenticated, loading } = useAuth();
    const [submitError, setSubmitError] = useState<ErrorCode | null>(null);

    useEffect(() => {
        if (!loading && authenticated) {
            const next = searchParams.get('next') ?? '/dashboard';
            router.replace(next);
        }
    }, [loading, authenticated, router, searchParams]);

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: '', password: '', rememberMe: false },
    });

    async function onSubmit(values: LoginInput) {
        setSubmitError(null);
        try {
            await login(values);
        } catch (err) {
            setSubmitError(resolveErrorCode(err));
        }
    }

    return (
        <Card className="w-full border-border/70 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur">
            <CardHeader className="space-y-3 px-8 pt-8 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                    {t('atmosphere')}
                </p>
                <CardTitle className="font-heading text-3xl font-medium tracking-tight">
                    {t('title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {submitError && (
                            <div
                                role="alert"
                                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            >
                                {t(`errors.${submitError}`)}
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('username')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="username"
                                            placeholder={t('usernamePlaceholder')}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('password')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            autoComplete="current-password"
                                            placeholder={t('passwordPlaceholder')}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-primary"
                                    {...form.register('rememberMe')}
                                />
                                {t('rememberMe')}
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-primary hover:underline"
                            >
                                {t('forgotPassword')}
                            </Link>
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? t('submitting') : t('submit')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
