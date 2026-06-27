'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Home,
    Mail,
    MapPin,
    Maximize2,
    Phone,
    Tag,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { customerService } from '@/services/customer-service';
import type { IInterestProfileDTO, ILeadDTO, LeadStage } from '@/types/customer';
import { LeadStageBadge } from '@/components/lead/lead-stage-badge';
import { LeadActions } from '@/components/lead/lead-actions';
import { LeadDetailModal } from '@/components/lead/lead-detail-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 20;

const LEAD_STAGES: LeadStage[] = [
    'NEW',
    'ASSIGNED',
    'ACCEPTED',
    'IN_POOL',
    'CONTACTED',
    'QUALIFIED',
    'CONVERTED',
    'DISCARDED',
];

export default function AdminLeadsPage() {
    const tNav = useTranslations('nav.admin');
    const t = useTranslations('pages.leads');
    const { role } = useAuth();

    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<ILeadDTO | null>(null);

    const { data, isPending, isError } = useQuery({
        queryKey: ['leads', 'list', page, PAGE_SIZE, stage] as const,
        queryFn: () => customerService.listLeads(page, PAGE_SIZE, stage),
    });

    const leads = data?.data ?? [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-medium tracking-tight">
                        {tNav('leads')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {role === 'AGENT' ? t('description.agent') : t('description.manager')}
                    </p>
                </div>

                <Select
                    value={selectedStage}
                    onValueChange={(value) => {
                        setSelectedStage(value as LeadStage | 'all');
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t('filter.stage')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('filter.all')}</SelectItem>
                        {LEAD_STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {t(`stages.${s}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('error.fetch')}</AlertDescription>
                </Alert>
            ) : isPending ? (
                <div className="grid gap-4">
                    {mainLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onOpen={() => setSelected(lead)} />
                    ))}
                </div>
            ) : leads.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-muted-foreground">{t('empty.message')}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4">
                        {poolLeads.map((lead) => (
                            <LeadCard key={lead.id} lead={lead} onOpen={() => setSelected(lead)} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-muted-foreground">
                                {t('pagination.info', {
                                    current: page + 1,
                                    total: totalPages,
                                    count: pagination?.totalCount ?? leads.length,
                                })}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    {t('pagination.prev')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                >
                                    {t('pagination.next')}
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <LeadDetailModal
                lead={selected}
                open={!!selected}
                onOpenChange={(o) => {
                    if (!o) setSelected(null);
                }}
            />
        </div>
    );
}

function LeadCard({ lead, onOpen }: { lead: ILeadDTO; onOpen: () => void }) {
    const t = useTranslations('pages.leads');

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <button
                        type="button"
                        onClick={onOpen}
                        className="min-w-0 text-left"
                    >
                        <CardTitle className="font-heading text-lg hover:underline">
                            {lead.name || t('unnamed')}
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            #{lead.id} · {t(`sources.${lead.source}`)}
                        </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                        <LeadStageBadge stage={lead.stage} />
                        <Button variant="ghost" size="sm" onClick={onOpen}>
                            <Maximize2 className="h-4 w-4" />
                            {t('detail.open')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
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
                            <span className="truncate">{lead.phone}</span>
                        </a>
                    )}
                </div>

                {lead.message && (
                    <div className="rounded-md bg-muted/60 p-3">
                        <p className="line-clamp-3 text-xs text-muted-foreground">{lead.message}</p>
                    </div>
                )}

                {lead.interestTags && lead.interestTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {lead.interestTags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>
                        {lead.lastContactAt
                            ? `${t('lastContact')}: ${new Date(lead.lastContactAt).toLocaleDateString()}`
                            : t('noContact')}
                    </span>
                    {lead.responsible && (
                        <span>
                            {t('responsible')}: {lead.responsible.login}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
