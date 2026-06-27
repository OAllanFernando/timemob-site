'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { LeadStage } from '@/types/customer';

const STAGE_CLASSES: Record<LeadStage, string> = {
    NEW: 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
    ASSIGNED: 'bg-violet-100 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    IN_POOL: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    CONTACTED: 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
    QUALIFIED: 'bg-teal-100 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200',
    CONVERTED: 'bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-200',
    DISCARDED: 'bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
};

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
    const t = useTranslations('pages.leads.stages');
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium',
                STAGE_CLASSES[stage],
            )}
        >
            {t(stage)}
        </span>
    );
}
