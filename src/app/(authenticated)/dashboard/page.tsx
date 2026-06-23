'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { resolveAreaForRole } from '@/lib/auth/roles';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const t = useTranslations('loader');

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/entrar');
            return;
        }
        const area = resolveAreaForRole(user.authorities);
        const target =
            area === 'owner' || area === 'admin'
                ? '/painel'
                : area === 'client'
                  ? '/conta'
                  : '/imoveis';
        router.replace(target);
    }, [loading, user, router]);

    return (
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
            {t('message')}
        </div>
    );
}
