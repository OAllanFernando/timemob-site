'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Mail, MapPin, MessageCircle, Phone, Send, Tag } from 'lucide-react';

import { propertyService } from '@/services/property-service';
import type { IInterestProfileDTO, ILeadDTO } from '@/types/customer';
import { LeadStageBadge } from '@/components/lead/lead-stage-badge';
import { LeadActions } from '@/components/lead/lead-actions';
import { PropertiesMap } from '@/components/maps/properties-map';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
    lead: ILeadDTO | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LeadDetailModal({ lead, open, onOpenChange }: Props) {
    const t = useTranslations('pages.leads');
    const td = useTranslations('pages.leads.detail');

    const { data, isPending } = useQuery({
        queryKey: ['properties', 'nearby', lead?.id, lead?.latitude, lead?.longitude] as const,
        queryFn: () => propertyService.listNearby(lead?.latitude, lead?.longitude),
        enabled: open && !!lead,
    });
    const properties = data?.data ?? [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col gap-0 overflow-hidden p-0"
                style={{
                    maxHeight: 'calc(100dvh - 2rem)',
                    maxWidth: '80rem',
                    width: 'calc(100vw - 2rem)',
                }}
            >
                {lead && (
                    <>
                        <DialogHeader className="border-b p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                                <DialogTitle className="font-heading text-xl">
                                    {lead.name || t('unnamed')}
                                </DialogTitle>
                                <LeadStageBadge stage={lead.stage} />
                            </div>
                        </DialogHeader>

                        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
                            {/* Left: the person's form / info */}
                            <div className="min-h-0 space-y-5 overflow-y-auto border-b p-4 text-sm lg:border-b-0 lg:border-r">
                                <Section title={td('contact')}>
                                    <p className="text-xs text-muted-foreground">
                                        #{lead.id} · {t(`sources.${lead.source}`)}
                                    </p>
                                    {lead.email && (
                                        <a
                                            href={`mailto:${lead.email}`}
                                            className="flex items-center gap-2 text-foreground/80 hover:underline"
                                        >
                                            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span className="truncate">{lead.email}</span>
                                        </a>
                                    )}
                                    {lead.phone && (
                                        <a
                                            href={`tel:${lead.phone}`}
                                            className="flex items-center gap-2 text-foreground/80 hover:underline"
                                        >
                                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span>{lead.phone}</span>
                                        </a>
                                    )}
                                    {lead.responsible && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('responsible')}: {lead.responsible.login}
                                        </p>
                                    )}
                                </Section>

                                {lead.interestTags && lead.interestTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {lead.interestTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                                            >
                                                <Tag className="h-3 w-3" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {(lead.interestProfiles ?? []).length > 0 && (
                                    <Section title={td('interest')}>
                                        {(lead.interestProfiles ?? []).map((p) => (
                                            <div
                                                key={p.id}
                                                className="rounded-md border border-dashed p-2 text-xs text-muted-foreground"
                                            >
                                                {profileDetails(p)}
                                                {p.notes && <p className="mt-1 italic">{p.notes}</p>}
                                            </div>
                                        ))}
                                    </Section>
                                )}

                                <Section title={td('message')}>
                                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                                        {lead.message || td('noMessage')}
                                    </p>
                                </Section>
                            </div>

                            {/* Right: the lead point cross-referenced with nearby properties */}
                            <div className="flex min-h-0 flex-col gap-2 p-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {td('mapTitle')}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        ({properties.length})
                                    </span>
                                </div>
                                <div className="min-h-[300px] flex-1">
                                    {isPending ? (
                                        <Skeleton className="h-full min-h-[300px] w-full rounded-md" />
                                    ) : (
                                        <PropertiesMap
                                            lead={{
                                                latitude: lead.latitude,
                                                longitude: lead.longitude,
                                                label: lead.name,
                                            }}
                                            properties={properties}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer: funnel actions + the future chat (placeholder for now) */}
                        <div className="space-y-3 border-t bg-muted/20 p-4">
                            <LeadActions lead={lead} />
                            <div className="flex items-center gap-2 opacity-70">
                                <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <Input
                                    disabled
                                    placeholder={td('chat.placeholder')}
                                    className="h-9 flex-1"
                                />
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {td('chat.soon')}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
            {children}
        </div>
    );
}

function profileDetails(p: IInterestProfileDTO): string {
    const price =
        p.minAmount || p.maxAmount
            ? `${p.minAmount ? brl(p.minAmount) : ''}${p.minAmount && p.maxAmount ? ' – ' : ''}${p.maxAmount ? brl(p.maxAmount) : ''}`
            : null;
    return [
        p.title,
        p.propertyType,
        p.propertyBusinessType,
        price,
        p.bedroom ? `${p.bedroom} dorm.` : null,
        p.bathroom ? `${p.bathroom} banh.` : null,
        p.neighborhood?.name ?? p.city?.name,
    ]
        .filter(Boolean)
        .join(' · ');
}

function brl(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
