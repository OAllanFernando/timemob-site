'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { LeadFormSource } from '@/lib/schemas/lead';

import { LeadCaptureModal } from './lead-capture-modal';

interface Props {
    label: string;
    /** Optional: override the default GENERIC_CONTACT source. */
    source?: LeadFormSource;
    /** Optional: property id when the CTA lives on a property detail page. */
    propertyId?: number;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'sm' | 'default' | 'lg';
}

export function ContactCtaButton({
    label,
    source = 'GENERIC_CONTACT',
    propertyId,
    variant = 'default',
    size = 'lg',
}: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant={variant} size={size} onClick={() => setOpen(true)}>
                <MessageCircle className="size-4" />
                {label}
            </Button>
            <LeadCaptureModal
                open={open}
                onOpenChange={setOpen}
                defaultSource={source}
                propertyId={propertyId}
            />
        </>
    );
}
