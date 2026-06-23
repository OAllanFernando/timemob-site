import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Building2, Compass, Handshake, KeyRound, Mail, MapPin, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ContactCtaButton } from '@/components/lead/contact-cta-button';

const PUBLIC_NAV = [
    { href: '/imoveis', key: 'publicProperties' as const },
    { href: '#about', key: 'publicAbout' as const },
    { href: '#how-it-works', key: 'publicHowItWorks' as const },
    { href: '#contact', key: 'publicContact' as const },
];

const STEPS = [
    { key: 'discover' as const, icon: Compass },
    { key: 'schedule' as const, icon: KeyRound },
    { key: 'decide' as const, icon: Handshake },
];

export default async function HomePage() {
    const t = await getTranslations('landing');
    const tBrand = await getTranslations('brand');
    const tNav = await getTranslations('nav');
    const tFooter = await getTranslations('footer');
    const year = 2026;

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
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
                        <Button asChild size="sm" className="ml-2">
                            <Link href="/entrar">{t('ctaLogin')}</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[120%] bg-gradient-to-b from-secondary/60 via-background to-background"
                    />
                    <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
                        <div className="max-w-3xl space-y-7">
                            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                                {t('eyebrow')}
                            </p>
                            <h1 className="font-heading text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                                {t('heroTitle')}
                            </h1>
                            <p className="max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
                                {t('heroSubtitle')}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Button asChild size="lg">
                                    <Link href="/entrar">{t('ctaLogin')}</Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="/imoveis">{t('ctaCatalog')}</Link>
                                </Button>
                                <Button asChild size="lg" variant="ghost">
                                    <Link href="#how-it-works">{t('ctaSecondary')}</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="about" className="border-t border-border/60 bg-card">
                    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_2fr] md:py-24">
                        <div className="space-y-3">
                            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                                {t('about.eyebrow')}
                            </p>
                            <h2 className="font-heading text-3xl font-medium tracking-tight md:text-4xl">
                                {t('about.title')}
                            </h2>
                        </div>
                        <p className="text-lg leading-relaxed text-muted-foreground">
                            {t('about.body')}
                        </p>
                    </div>
                </section>

                <section id="how-it-works" className="border-t border-border/60">
                    <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
                        <div className="max-w-2xl space-y-3">
                            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                                {t('howItWorks.eyebrow')}
                            </p>
                            <h2 className="font-heading text-3xl font-medium tracking-tight md:text-4xl">
                                {t('howItWorks.title')}
                            </h2>
                        </div>

                        <ol className="mt-12 grid gap-6 md:grid-cols-3">
                            {STEPS.map(({ key, icon: Icon }, index) => (
                                <li
                                    key={key}
                                    className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-7 transition-colors hover:border-primary/40"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <Icon className="size-5" />
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            0{index + 1}
                                        </span>
                                    </div>
                                    <h3 className="font-heading text-xl font-medium tracking-tight">
                                        {t(`howItWorks.steps.${key}.title`)}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {t(`howItWorks.steps.${key}.body`)}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section id="contact" className="border-t border-border/60 bg-secondary/40">
                    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-24">
                        <div className="space-y-4">
                            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                                {t('contact.eyebrow')}
                            </p>
                            <h2 className="font-heading text-3xl font-medium tracking-tight md:text-4xl">
                                {t('contact.title')}
                            </h2>
                            <p className="text-lg leading-relaxed text-muted-foreground">
                                {t('contact.body')}
                            </p>
                            <div className="pt-2">
                                <ContactCtaButton label={t('contact.cta')} />
                            </div>
                        </div>

                        <dl className="space-y-6">
                            <ContactRow
                                icon={MapPin}
                                label={t('contact.addressLabel')}
                                value={t('contact.address')}
                            />
                            <ContactRow
                                icon={Phone}
                                label={t('contact.phoneLabel')}
                                value={t('contact.phone')}
                            />
                            <ContactRow
                                icon={Mail}
                                label={t('contact.emailLabel')}
                                value={t('contact.email')}
                            />
                        </dl>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border/60 bg-card">
                <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <Building2 className="size-4" />
                            </span>
                            <span className="font-heading text-base font-semibold tracking-tight">
                                {tBrand('name')}
                            </span>
                        </div>
                        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                            {tFooter('tagline')}
                        </p>
                    </div>

                    <FooterColumn title={tFooter('exploreLabel')}>
                        <FooterLink href="#about">{tFooter('exploreLinks.about')}</FooterLink>
                        <FooterLink href="#how-it-works">
                            {tFooter('exploreLinks.howItWorks')}
                        </FooterLink>
                        <FooterLink href="#contact">{tFooter('exploreLinks.contact')}</FooterLink>
                        <FooterLink href="/entrar">{tFooter('exploreLinks.login')}</FooterLink>
                    </FooterColumn>

                    <FooterColumn title={tFooter('contactLabel')}>
                        <span className="text-sm text-muted-foreground">{t('contact.address')}</span>
                        <span className="text-sm text-muted-foreground">{t('contact.phone')}</span>
                        <span className="text-sm text-muted-foreground">{t('contact.email')}</span>
                    </FooterColumn>

                    <FooterColumn title={tFooter('socialLabel')}>
                        <FooterLink href="#">{tFooter('social.instagram')}</FooterLink>
                        <FooterLink href="#">{tFooter('social.facebook')}</FooterLink>
                        <FooterLink href="#">{tFooter('social.linkedin')}</FooterLink>
                    </FooterColumn>
                </div>

                <div className="border-t border-border/60">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
                        <span>
                            © {year} {tBrand('name')}. {tFooter('rights')}
                        </span>
                        <span className="font-mono">{tBrand('siteName')}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function ContactRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof MapPin;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-4">
            <span className="mt-1 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
            </span>
            <div className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                </dt>
                <dd className="text-base text-foreground">{value}</dd>
            </div>
        </div>
    );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {title}
            </h3>
            <ul className="flex flex-col gap-2">
                {Array.isArray(children)
                    ? children.map((child, i) => <li key={i}>{child}</li>)
                    : <li>{children}</li>}
            </ul>
        </div>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
            {children}
        </Link>
    );
}
