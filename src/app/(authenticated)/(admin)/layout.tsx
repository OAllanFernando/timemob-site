'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { resolveAreaForRole } from '@/lib/auth/roles';
import { AppSidebar, type AppSidebarVariant } from '@/components/layout/app-sidebar';
import { LicenseExpiredScreen } from '@/components/billing/license-expired-screen';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, licenseActive, loading } = useAuth();
    const router = useRouter();
    const t = useTranslations('loader');

    const area = resolveAreaForRole(user?.authorities);

    useEffect(() => {
        if (loading) return;
        if (area === 'client') {
            router.replace('/conta');
        } else if (area === 'fallback') {
            router.replace('/imoveis');
        }
    }, [loading, area, router]);

    if (loading || area === 'client' || area === 'fallback') {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                {t('message')}
            </div>
        );
    }

    // License gate: an expired/absent license blocks the WHOLE operational area for every operational
    // role (Owner included). The public site + lead capture are unaffected (leads keep accumulating).
    // Block only on an explicit false (fail-open while still loading / unknown). The CRM add-on is a
    // narrower gate handled at the leads page, not here.
    if (licenseActive === false) {
        return <LicenseExpiredScreen />;
    }

    const variant: AppSidebarVariant = area === 'owner' ? 'owner' : 'admin';

    return (
        <SidebarProvider>
            <AppSidebar variant={variant} />
            <SidebarInset className="min-w-0">
                <Topbar />
                <main className="flex min-w-0 flex-1 flex-col p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
