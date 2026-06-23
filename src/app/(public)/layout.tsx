import Link from 'next/link';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Building2 } from 'lucide-react';

import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const PUBLIC_NAV = [
    { href: '/imoveis', key: 'publicProperties' as const },
    { href: '/#about', key: 'publicAbout' as const },
    { href: '/#how-it-works', key: 'publicHowItWorks' as const },
    { href: '/#contact', key: 'publicContact' as const },
];

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tBrand = await getTranslations('brand');
    const tNav = await getTranslations('nav');

    return (
        <div className="relative flex min-h-screen flex-col bg-background text-foreground">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-gradient-to-b from-secondary/60 via-background to-background"
            />

            <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Building2 className="size-4" />
                        </span>
                        <span className="font-heading text-lg font-semibold tracking-tight">
                            {tBrand('name')}
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {PUBLIC_NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {tNav(item.key)}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-1">
                        <LocaleSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center px-6 py-12 md:py-20">
                <div className="w-full max-w-lg">{children}</div>
            </main>
        </div>
    );
}
