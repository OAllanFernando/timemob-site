'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { authenticated, loading } = useAuth();
    const router = useRouter();
    const t = useTranslations('loader');

    useEffect(() => {
        if (!loading && !authenticated) {
            router.replace('/login');
        }
    }, [loading, authenticated, router]);

    if (loading || !authenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                {t('message')}
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
                <Topbar />
                <main className="flex min-w-0 flex-1 flex-col p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
