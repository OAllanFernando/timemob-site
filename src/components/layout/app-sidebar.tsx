'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Building2,
    CalendarCheck,
    Headphones,
    Heart,
    Home,
    LayoutDashboard,
    Network,
    User,
    UserPlus,
    Users,
    type LucideIcon,
} from 'lucide-react';

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

export type AppSidebarVariant = 'admin' | 'owner' | 'client';

interface AppSidebarProps {
    variant: AppSidebarVariant;
}

type NavItem = {
    href: string;
    icon: LucideIcon;
    key: string;
};

const ADMIN_ITEMS: NavItem[] = [
    { href: '/painel', icon: LayoutDashboard, key: 'admin.dashboard' },
    { href: '/painel/leads', icon: UserPlus, key: 'admin.leads' },
    { href: '/painel/imoveis', icon: Home, key: 'admin.properties' },
    { href: '/painel/visitas', icon: CalendarCheck, key: 'admin.visits' },
    { href: '/painel/equipe', icon: Users, key: 'admin.team' },
];

const OWNER_ITEMS: NavItem[] = [
    ...ADMIN_ITEMS,
    { href: '/painel/filiais', icon: Network, key: 'admin.branches' },
];

const CLIENT_ITEMS: NavItem[] = [
    { href: '/conta', icon: LayoutDashboard, key: 'client.home' },
    { href: '/conta/visitas', icon: CalendarCheck, key: 'client.visits' },
    { href: '/conta/favoritos', icon: Heart, key: 'client.favorites' },
    { href: '/conta/perfil', icon: User, key: 'client.profile' },
];

const ITEMS_BY_VARIANT: Record<AppSidebarVariant, NavItem[]> = {
    admin: ADMIN_ITEMS,
    owner: OWNER_ITEMS,
    client: CLIENT_ITEMS,
};

const ACTIVE_INDICATOR =
    'relative data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary data-[active=true]:font-medium';

export function AppSidebar({ variant }: AppSidebarProps) {
    const pathname = usePathname();
    const tNav = useTranslations('nav');
    const tBrand = useTranslations('brand');
    const tSidebar = useTranslations('sidebar');

    const items = ITEMS_BY_VARIANT[variant];

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
                            {tSidebar(`eyebrowByVariant.${variant}`)}
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
                            {items.map(({ href, icon: Icon, key }) => {
                                const isActive =
                                    pathname === href || pathname.startsWith(`${href}/`);
                                const label = tNav(key);
                                return (
                                    <SidebarMenuItem key={`${href}-${key}`}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            size="lg"
                                            tooltip={label}
                                            className={ACTIVE_INDICATOR}
                                        >
                                            <Link href={href}>
                                                <Icon className="size-4" />
                                                <span>{label}</span>
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
