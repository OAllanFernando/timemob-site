'use client';

import { Building2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { useSiteSetup } from '@/hooks/use-site-setup';
import { BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    /** Wrapper class (applied to both the image and the fallback lockup). */
    className?: string;
    /** Logo height in px (width auto). */
    height?: number;
    /** Render only the mark (no wordmark) — for tight/collapsed spots. */
    markOnly?: boolean;
    /** Size class for the fallback icon box. */
    iconClassName?: string;
    /** Class for the fallback wordmark text. */
    nameClassName?: string;
}

/**
 * White-label brand mark. Renders the tenant's logo (the operating agency's `isPrimary` media,
 * served from the platform CDN/S3 — allowlisted in `next.config.ts`) fetched from
 * `GET /api/site/setup`. While loading, on error, or for a tenant with no logo, falls back to a
 * generic icon + {@link BRAND_NAME} wordmark so the build never breaks.
 */
export function BrandLogo({
    className,
    height = 36,
    markOnly = false,
    iconClassName,
    nameClassName,
}: BrandLogoProps) {
    const { data: setup } = useSiteSetup();
    const [failed, setFailed] = useState(false);

    const logoUrl = setup?.agency?.logoUrl ?? undefined;
    const displayName = setup?.agency?.name?.trim() || BRAND_NAME;

    if (logoUrl && !failed) {
        return (
            <Image
                src={logoUrl}
                alt={displayName}
                width={height * 5}
                height={height}
                priority
                style={{ height, width: 'auto' }}
                className={cn('object-contain', className)}
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <span className={cn('flex items-center gap-2.5', className)}>
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground',
                    iconClassName,
                )}
            >
                <Building2 className="size-4" />
            </span>
            {!markOnly && (
                <span
                    className={cn(
                        'font-heading text-lg font-semibold tracking-tight',
                        nameClassName,
                    )}
                >
                    {displayName}
                </span>
            )}
        </span>
    );
}
