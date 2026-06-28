/**
 * Builds a "talk to us" href from the tenant's contact details (from `GET /api/site/setup`).
 * Prefers WhatsApp (wa.me), then phone (tel:), then email (mailto:). Returns null when none exist.
 */
export function resolveContactHref(
    whatsapp?: string | null,
    phone?: string | null,
    email?: string | null,
): string | null {
    if (whatsapp?.trim()) {
        const digits = whatsapp.replace(/\D/g, '');
        if (digits) return `https://wa.me/${digits}`;
    }
    if (phone?.trim()) {
        const digits = phone.replace(/[^\d+]/g, '');
        if (digits) return `tel:${digits}`;
    }
    if (email?.trim()) return `mailto:${email.trim()}`;
    return null;
}
