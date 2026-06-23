'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { customerService } from '@/services/customer-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainError } from '@/types/domain-response';

export function CrossTenantConsent() {
    const t = useTranslations('auth.crossTenant');
    const { currentTenant, refreshAccount, logout } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const terms = currentTenant?.termsAndConditions;

    async function onAccept() {
        setError(null);
        setSubmitting(true);
        try {
            await customerService.acceptCurrentTenantMembership(terms?.version ?? null);
            await refreshAccount();
            toast.success(t('success'));
        } catch (err) {
            if (err instanceof DomainError) {
                if (err.code === 'network') {
                    setError(t('errors.network'));
                } else {
                    setError(err.message || t('errors.unknown'));
                }
            } else {
                setError(t('errors.unknown'));
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
            <Card className="w-full max-w-2xl border-border/70 bg-card/95 shadow-xl shadow-primary/5">
                <CardHeader className="space-y-3 px-8 pt-8 text-center">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="size-6" />
                    </span>
                    <CardTitle className="font-heading text-2xl font-medium tracking-tight">
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 px-8 pb-8 text-sm leading-relaxed">
                    <p className="text-muted-foreground">
                        {t.rich('intro', {
                            tenant: () => (
                                <strong className="text-foreground">
                                    {currentTenant?.name ?? ''}
                                </strong>
                            ),
                        })}
                    </p>

                    {terms ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    {t('termsLabel')}
                                </p>
                                {terms.version && (
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {terms.version}
                                    </span>
                                )}
                            </div>
                            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground">
                                {terms.text}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">{t('fallbackBody')}</p>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={logout}
                            disabled={submitting}
                        >
                            {t('decline')}
                        </Button>
                        <Button type="button" onClick={onAccept} disabled={submitting}>
                            {submitting ? t('submitting') : t('accept')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
