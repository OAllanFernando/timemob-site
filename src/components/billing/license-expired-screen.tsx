'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle, ShieldAlert } from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useSiteSetup } from '@/hooks/use-site-setup';
import { resolveContactHref } from '@/lib/contact';

/**
 * Full-screen takeover shown in place of the WHOLE operational area when the tenant's license is
 * expired/absent (`licenseActive === false`). Blocks every operational role (Owner included) — no
 * one operates without an active license. The public site and lead capture are unaffected (leads
 * keep accumulating). Routes the staff to contact to renew (a direct-payment flow comes later).
 */
export function LicenseExpiredScreen() {
    const t = useTranslations('pages.licenseExpired');
    const { logout } = useAuth();
    const { data: setup } = useSiteSetup();

    const contact = setup?.contact;
    const contactHref = resolveContactHref(contact?.whatsapp, contact?.phone, contact?.email);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 py-12 text-center">
            <BrandLogo height={40} />

            <div className="flex max-w-md flex-col items-center gap-4">
                <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <ShieldAlert className="size-6" />
                </span>
                <h1 className="font-heading text-2xl font-medium tracking-tight">{t('title')}</h1>
                <p className="text-balance text-sm leading-relaxed text-muted-foreground">
                    {t('body')}
                </p>

                <div className="flex flex-col items-center gap-3 pt-2">
                    {contactHref ? (
                        <Button asChild>
                            <a href={contactHref} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="size-4" />
                                {t('renewCta')}
                            </a>
                        </Button>
                    ) : (
                        <Button disabled>
                            <MessageCircle className="size-4" />
                            {t('renewCta')}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => logout()}>
                        {t('logout')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
