'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { CrossTenantConsent } from '@/components/auth/cross-tenant-consent';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { authenticated, loading, crossTenant } = useAuth();
    const router = useRouter();
    const t = useTranslations('loader');

    useEffect(() => {
        if (!loading && !authenticated) {
            router.replace('/entrar');
        }
    }, [loading, authenticated, router]);

    if (loading || !authenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                {t('message')}
            </div>
        );
    }

    if (crossTenant) {
        return <CrossTenantConsent />;
    }

    return <>{children}</>;
}
