'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Headphones, Home } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
    { href: '/dashboard', icon: Home, key: 'dashboard' as const },
];

const ACTIVE_INDICATOR =
    'relative data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary data-[active=true]:font-medium';

export function AppSidebar() {
    const pathname = usePathname();
    const tNav = useTranslations('nav');
    const tBrand = useTranslations('brand');
    const tSidebar = useTranslations('sidebar');

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="gap-2 px-3 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                        <Building2 className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                        <span className="font-heading text-lg font-semibold leading-tight tracking-tight">
                            {tBrand('name')}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                            {tSidebar('eyebrow')}
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarSeparator className="mx-3" />

            <SidebarContent className="px-2 py-3">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/55">
                        {tSidebar('groupNavigation')}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {NAV_ITEMS.map(({ href, icon: Icon, key }) => {
                                const isActive =
                                    pathname === href || pathname.startsWith(`${href}/`);
                                return (
                                    <SidebarMenuItem key={`${href}-${key}`}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            size="lg"
                                            tooltip={tNav(key)}
                                            className={ACTIVE_INDICATOR}
                                        >
                                            <Link href={href}>
                                                <Icon className="size-4" />
                                                <span>{tNav(key)}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="gap-2 p-3">
                <SidebarSeparator className="mx-0 mb-1" />
                <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/60 px-3 py-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar/60 text-sidebar-primary">
                        <Headphones className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-xs font-medium leading-tight">
                            {tSidebar('supportTitle')}
                        </span>
                        <span className="text-[11px] leading-tight text-sidebar-foreground/65">
                            {tSidebar('supportBody')}
                        </span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
