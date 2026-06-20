'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { resolveAreaForRole } from '@/lib/auth/roles';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const t = useTranslations('loader');

    const area = resolveAreaForRole(user?.authorities);

    useEffect(() => {
        if (loading) return;
        if (area === 'admin' || area === 'owner') {
            router.replace('/painel');
        } else if (area === 'fallback') {
            router.replace('/imoveis');
        }
    }, [loading, area, router]);

    if (loading || area !== 'client') {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                {t('message')}
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar variant="client" />
            <SidebarInset className="min-w-0">
                <Topbar />
                <main className="flex min-w-0 flex-1 flex-col p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
