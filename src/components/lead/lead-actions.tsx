'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Check,
    Hand,
    Loader2,
    MessageCircle,
    Star,
    UserPlus,
    X,
    type LucideIcon,
} from 'lucide-react';

import { customerService } from '@/services/customer-service';
import type { ILeadDTO, LeadStage } from '@/types/customer';
import { Button } from '@/components/ui/button';

type ActionRun = (id: number) => Promise<unknown>;

interface PrimaryAction {
    key: 'receive' | 'claim' | 'contact' | 'qualify' | 'convert';
    icon: LucideIcon;
    run: ActionRun;
}

/** The single forward action that makes sense for each funnel stage (the happy path). */
function primaryActionFor(stage: LeadStage): PrimaryAction | null {
    switch (stage) {
        case 'ASSIGNED':
            return { key: 'receive', icon: Check, run: (id) => customerService.receiveLead(id) };
        case 'IN_POOL':
            return { key: 'claim', icon: Hand, run: (id) => customerService.claimLead(id) };
        case 'ACCEPTED':
            return {
                key: 'contact',
                icon: MessageCircle,
                run: (id) => customerService.advanceLeadStage(id, 'CONTACTED'),
            };
        case 'CONTACTED':
            return {
                key: 'qualify',
                icon: Star,
                run: (id) => customerService.advanceLeadStage(id, 'QUALIFIED'),
            };
        case 'QUALIFIED':
            return { key: 'convert', icon: UserPlus, run: (id) => customerService.convertLead(id) };
        default:
            return null;
    }
}

const OPEN_STAGES: LeadStage[] = [
    'NEW',
    'ASSIGNED',
    'ACCEPTED',
    'IN_POOL',
    'CONTACTED',
    'QUALIFIED',
];

export function LeadActions({ lead }: { lead: ILeadDTO }) {
    const t = useTranslations('pages.leads.actions');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (run: ActionRun) => run(lead.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast.success(t('success'));
        },
        onError: () => toast.error(t('error')),
    });

    const primary = primaryActionFor(lead.stage);
    const canDiscard = OPEN_STAGES.includes(lead.stage);

    if (!primary && !canDiscard) return null;

    const PrimaryIcon = primary?.icon;

    return (
        <div className="flex flex-wrap gap-2 border-t pt-3">
            {primary && PrimaryIcon && (
                <Button
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(primary.run)}
                >
                    {mutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <PrimaryIcon className="h-4 w-4" />
                    )}
                    {t(primary.key)}
                </Button>
            )}
            {canDiscard && (
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate((id) => customerService.advanceLeadStage(id, 'DISCARDED'))}
                >
                    <X className="h-4 w-4" />
                    {t('discard')}
                </Button>
            )}
        </div>
    );
}
