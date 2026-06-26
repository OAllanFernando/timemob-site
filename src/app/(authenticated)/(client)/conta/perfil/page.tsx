'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, Pencil } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { customerService } from '@/services/customer-service';
import type { IInterestProfileDTO, IInterestProfileRequest } from '@/types/customer';
import {
    BUSINESS_TYPES,
    PROPERTY_TYPES,
    interestProfileSchema,
    type InterestProfileInput,
} from '@/lib/schemas/interest-profile';
import { InterestProfileFields } from '@/app/(public)/entrar/components/interest-profile-fields';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';

const PROFILES_QUERY_KEY = ['interest-profiles', 'mine'] as const;

export default function ClientProfilePage() {
    const tNav = useTranslations('nav.client');
    const t = useTranslations('pages.profile');

    const { data, isPending, isError } = useQuery({
        queryKey: PROFILES_QUERY_KEY,
        queryFn: () => customerService.listMyInterestProfiles(),
    });

    const profiles = data?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="font-heading text-3xl font-medium tracking-tight">
                    {tNav('profile')}
                </h1>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>

            {isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('error.fetch')}</AlertDescription>
                </Alert>
            ) : isPending ? (
                <div className="grid gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
            ) : profiles.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-muted-foreground">{t('empty.message')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {profiles.map((profile) => (
                        <InterestProfileCard key={profile.id} profile={profile} />
                    ))}
                </div>
            )}
        </div>
    );
}

function InterestProfileCard({ profile }: { profile: IInterestProfileDTO }) {
    const t = useTranslations('pages.profile');
    const [open, setOpen] = useState(false);

    const summary = [
        profile.propertyType,
        profile.bedroom ? t('summary.bedrooms', { count: profile.bedroom }) : null,
        profile.maxAmount ? t('summary.upTo', { value: formatBRL(profile.maxAmount) }) : null,
        profile.city?.name,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="min-w-0">
                    <CardTitle className="font-heading text-lg">
                        {profile.title || t('card.untitled')}
                    </CardTitle>
                    {summary && (
                        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                    <Pencil className="h-4 w-4" />
                    {t('edit')}
                </Button>
            </CardHeader>
            {profile.notes && (
                <CardContent className="pt-0">
                    <p className="line-clamp-2 text-xs text-muted-foreground">{profile.notes}</p>
                </CardContent>
            )}

            <InterestProfileEditDialog profile={profile} open={open} onOpenChange={setOpen} />
        </Card>
    );
}

function InterestProfileEditDialog({
    profile,
    open,
    onOpenChange,
}: {
    profile: IInterestProfileDTO;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const t = useTranslations('pages.profile');
    const queryClient = useQueryClient();
    const { memberships, currentTenant, refreshAccount } = useAuth();

    // Contact authorization (data-sharing consent) status for the current tenant.
    const membership = currentTenant
        ? memberships.find((m) => m.tenant?.id === currentTenant.id)
        : undefined;
    const authorizedAt = membership?.termsAndConditionsAccept ?? null;
    const [authorize, setAuthorize] = useState(false);

    const form = useForm<InterestProfileInput>({
        resolver: zodResolver(interestProfileSchema),
        defaultValues: toFormDefaults(profile),
    });

    const willAuthorize = !authorizedAt && authorize;

    const mutation = useMutation({
        mutationFn: async (values: InterestProfileInput) => {
            const res = await customerService.updateInterestProfile(
                profile.id,
                values as IInterestProfileRequest,
            );
            // If the customer isn't authorized yet and ticked the box, saving the profile
            // also records the contact authorization (stamped with "now" on the backend).
            if (willAuthorize) {
                await customerService.acceptCurrentTenantMembership(
                    currentTenant?.termsAndConditions?.version ?? null,
                );
            }
            return res;
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
            if (willAuthorize) await refreshAccount();
            toast.success(t('saved'));
            onOpenChange(false);
        },
        onError: () => {
            toast.error(t('saveError'));
        },
    });

    const formId = `interest-profile-form-${profile.id}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('dialog.title')}</DialogTitle>
                    <DialogDescription>{t('dialog.description')}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        id={formId}
                        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
                        className="space-y-4"
                    >
                        <InterestProfileFields form={form} />

                        <div className="rounded-md border border-border bg-muted/30 p-4">
                            {authorizedAt ? (
                                <label className="flex items-start gap-3 text-sm">
                                    <Checkbox checked disabled className="mt-0.5" />
                                    <span className="text-muted-foreground">
                                        {t('consent.authorizedAt', {
                                            date: new Date(authorizedAt).toLocaleDateString(),
                                        })}
                                    </span>
                                </label>
                            ) : (
                                <label className="flex cursor-pointer items-start gap-3 text-sm">
                                    <Checkbox
                                        checked={authorize}
                                        onCheckedChange={(checked) =>
                                            setAuthorize(checked === true)
                                        }
                                        className="mt-0.5"
                                    />
                                    <span className="text-foreground">{t('consent.authorize')}</span>
                                </label>
                            )}
                        </div>
                    </form>
                </Form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={mutation.isPending}
                    >
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form={formId} disabled={mutation.isPending}>
                        {mutation.isPending ? t('saving') : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function toFormDefaults(p: IInterestProfileDTO): InterestProfileInput {
    const propertyType = PROPERTY_TYPES.includes(
        p.propertyType as (typeof PROPERTY_TYPES)[number],
    )
        ? (p.propertyType as (typeof PROPERTY_TYPES)[number])
        : undefined;
    const propertyBusinessType = BUSINESS_TYPES.includes(
        p.propertyBusinessType as (typeof BUSINESS_TYPES)[number],
    )
        ? (p.propertyBusinessType as (typeof BUSINESS_TYPES)[number])
        : undefined;

    return {
        propertyType,
        propertyBusinessType,
        neighborhoodName: p.neighborhood?.name ?? undefined,
        cityName: p.city?.name ?? undefined,
        stateName: p.state?.name ?? undefined,
        uf: p.state?.uf ?? undefined,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
        bedroom: p.bedroom,
        suite: p.suite,
        bathroom: p.bathroom,
        carVacancy: p.carVacancy,
        totalArea: p.totalArea,
        utilArea: p.utilArea,
        notes: p.notes,
        latitude: p.latitude,
        longitude: p.longitude,
    };
}

function formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    });
}
