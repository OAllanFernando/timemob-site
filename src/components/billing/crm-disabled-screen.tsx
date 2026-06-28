'use client';

import { useTranslations } from 'next-intl';
import { Lock, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSiteSetup } from '@/hooks/use-site-setup';
import { resolveContactHref } from '@/lib/contact';

/**
 * Shown in place of the LEADS area (only) when the tenant's CRM add-on is disabled
 * (`tenant.crmEnabled === false`). Renders inside the operational chrome (sidebar/topbar stay), so
 * it's a content card — not a fullscreen takeover. Leads keep accumulating via the public capture;
 * this routes the staff to contact (a direct-payment flow comes later).
 */
export function CrmDisabledScreen() {
    const t = useTranslations('pages.crmDisabled');
    const { data: setup } = useSiteSetup();

    const contact = setup?.contact;
    const contactHref = resolveContactHref(contact?.whatsapp, contact?.phone, contact?.email);

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="size-6" />
            </span>
            <div className="flex max-w-md flex-col items-center gap-3">
                <h1 className="font-heading text-2xl font-medium tracking-tight">{t('title')}</h1>
                <p className="text-balance text-sm leading-relaxed text-muted-foreground">
                    {t('body')}
                </p>
            </div>
            {contactHref ? (
                <Button asChild>
                    <a href={contactHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="size-4" />
                        {t('contactCta')}
                    </a>
                </Button>
            ) : (
                <Button disabled>
                    <MessageCircle className="size-4" />
                    {t('contactCta')}
                </Button>
            )}
        </div>
    );
}
