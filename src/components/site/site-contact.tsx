'use client';

import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';

import { useSiteSetup } from '@/hooks/use-site-setup';

interface ContactLabels {
    addressLabel: string;
    phoneLabel: string;
    emailLabel: string;
}

interface ContactFallback {
    address: string;
    phone: string;
    email: string;
}

/**
 * Resolves the tenant's real contact (from `GET /api/site/setup` → headquarters branch), falling
 * back to the i18n placeholders passed from the server component when a field is absent.
 */
function useResolvedContact(fallback: ContactFallback) {
    const { data: setup } = useSiteSetup();
    return {
        address: setup?.contact?.address?.trim() || fallback.address,
        phone: setup?.contact?.phone?.trim() || fallback.phone,
        email: setup?.contact?.email?.trim() || fallback.email,
    };
}

function ContactRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
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

/** The contact section's `<dl>` rows (address/phone/email). */
export function SiteContactRows({
    labels,
    fallback,
}: {
    labels: ContactLabels;
    fallback: ContactFallback;
}) {
    const contact = useResolvedContact(fallback);
    return (
        <dl className="space-y-6">
            <ContactRow icon={MapPin} label={labels.addressLabel} value={contact.address} />
            <ContactRow icon={Phone} label={labels.phoneLabel} value={contact.phone} />
            <ContactRow icon={Mail} label={labels.emailLabel} value={contact.email} />
        </dl>
    );
}

/** The footer's contact column lines (address/phone/email). */
export function SiteFooterContact({ fallback }: { fallback: ContactFallback }) {
    const contact = useResolvedContact(fallback);
    return (
        <>
            <span className="text-sm text-muted-foreground">{contact.address}</span>
            <span className="text-sm text-muted-foreground">{contact.phone}</span>
            <span className="text-sm text-muted-foreground">{contact.email}</span>
        </>
    );
}
