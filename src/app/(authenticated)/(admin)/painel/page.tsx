'use client';

import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { PlaceholderCard } from '@/components/layout/placeholder-card';

export default function AdminDashboardPage() {
    const t = useTranslations('dashboard');
    const tPlaceholder = useTranslations('pages.placeholder');
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

            <PlaceholderCard
                title={t('statsPlaceholder.title')}
                body={t('statsPlaceholder.description')}
                skeletons={3}
            />

            <PlaceholderCard
                title={tPlaceholder('title')}
                body={tPlaceholder('body')}
            />
        </div>
    );
}
