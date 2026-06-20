'use client';

import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const { user } = useAuth();

    if (!user) return null;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    const displayName = fullName || user.login;

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h1 className="font-heading text-3xl font-medium tracking-tight">
                    {t('greeting', { name: displayName })}
                </h1>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {t('statsPlaceholder.title')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {t('statsPlaceholder.description')}
                    </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <StatPlaceholder />
                    <StatPlaceholder />
                    <StatPlaceholder />
                </CardContent>
            </Card>
        </div>
    );
}

function StatPlaceholder() {
    return (
        <div className="space-y-3 rounded-lg border border-border bg-background p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2 w-full" />
        </div>
    );
}
