'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth-service';
import { customerService } from '@/services/customer-service';
import { toRegistrationRequest } from '@/lib/transformers/registration';
import { leadSchema, type LeadFormSource, type LeadInput } from '@/lib/schemas/lead';
import {
    interestProfileSchema,
    type InterestProfileInput,
} from '@/lib/schemas/interest-profile';
import {
    isCnpjConflict,
    isCpfConflict,
    isEmailConflict,
    looksLikeBackendLeak,
} from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TOKEN_STORAGE_KEY } from '@/lib/axios';
import { AddressPicker } from '@/components/maps/address-picker';
import { DomainError } from '@/types/domain-response';
import type { IPublicLeadRequest } from '@/types/customer';
import type { ResolvedAddress } from '@/lib/maps/google-maps';

import { InterestProfileFields } from '@/app/(public)/entrar/components/interest-profile-fields';

import { LeadSourceRadio } from './lead-source-radio';
import { InterestTagsChecks } from './interest-tags-checks';

export interface LeadCaptureFormProps {
    defaultSource?: LeadFormSource;
    propertyId?: number;
    onSuccess?: () => void;
}

function leadToRegistrationRequest(values: LeadInput) {
    return toRegistrationRequest({
        name: values.name,
        email: values.email,
        password: values.password ?? '',
        phoneNumber: values.phone,
        // Filling the lead form is an explicit request to be contacted.
        acceptContact: true,
    });
}

function toLeadRequest(values: LeadInput, propertyId?: number): IPublicLeadRequest {
    return {
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message?.trim() ? values.message : undefined,
        source: values.source,
        interestTags: values.interestTags?.length ? values.interestTags : undefined,
        latitude: values.interestLatitude ?? undefined,
        longitude: values.interestLongitude ?? undefined,
        propertyOfInterest: propertyId ? { id: propertyId } : undefined,
    };
}

export function LeadCaptureForm({
    defaultSource = 'GENERIC_CONTACT',
    propertyId,
    onSuccess,
}: LeadCaptureFormProps) {
    const t = useTranslations('lead');
    const { authenticated } = useAuth();

    const form = useForm<LeadInput>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            message: '',
            source: defaultSource,
            interestTags: [],
            interestLatitude: null,
            interestLongitude: null,
            acceptTerms: false as unknown as true,
            createAccount: false,
            password: '',
            confirmPassword: '',
            fillInterestProfile: false,
        },
    });

    const profileForm = useForm<InterestProfileInput>({
        resolver: zodResolver(interestProfileSchema),
        defaultValues: {
            propertyType: undefined,
            propertyBusinessType: undefined,
            notes: undefined,
        },
    });

    const createAccount = form.watch('createAccount');
    const fillInterestProfile = form.watch('fillInterestProfile');
    const interestLat = form.watch('interestLatitude');
    const interestLng = form.watch('interestLongitude');
    const [showDetails, setShowDetails] = useState(false);

    function handleInterestLocation(addr: ResolvedAddress) {
        form.setValue('interestLatitude', addr.latitude, { shouldDirty: true });
        form.setValue('interestLongitude', addr.longitude, { shouldDirty: true });
    }
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function onSubmit(values: LeadInput) {
        setServerError(null);
        try {
            if (values.createAccount) {
                try {
                    await customerService.register(leadToRegistrationRequest(values));
                } catch (err) {
                    if (isEmailConflict(err)) {
                        toast.error(t('errors.emailExists'));
                        form.setError('email', {
                            type: 'server',
                            message: t('errors.emailExists'),
                        });
                        return;
                    }
                    if (isCpfConflict(err)) {
                        toast.error(t('errors.cpfExists'));
                        setServerError(t('errors.cpfExists'));
                        return;
                    }
                    if (isCnpjConflict(err)) {
                        toast.error(t('errors.cnpjExists'));
                        setServerError(t('errors.cnpjExists'));
                        return;
                    }
                    throw err;
                }
                const authRes = await authService.login({
                    username: values.email,
                    password: values.password ?? '',
                    rememberMe: true,
                });
                if (typeof window !== 'undefined') {
                    localStorage.setItem(TOKEN_STORAGE_KEY, authRes.data.id_token);
                }
            }

            try {
                await customerService.submitLead(toLeadRequest(values, propertyId));
            } catch (err) {
                if (values.createAccount) {
                    toast.error(t('errors.leadPartial'));
                } else {
                    throw err;
                }
            }

            if (values.createAccount && values.fillInterestProfile) {
                const profileValid = await profileForm.trigger();
                if (profileValid) {
                    try {
                        await customerService.submitInterestProfile(profileForm.getValues());
                    } catch (err) {
                        console.error('[interest-profile] submit failed', err);
                        toast.error(t('errors.interestProfilePartial'));
                    }
                }
            }

            setSuccess(true);
        } catch (err) {
            if (err instanceof DomainError) {
                if (err.code === 'network') {
                    setServerError(t('errors.network'));
                    return;
                }
                if (err.fieldErrors) {
                    for (const [field, messages] of Object.entries(err.fieldErrors)) {
                        form.setError(field as keyof LeadInput, {
                            type: 'server',
                            message: messages.join(', '),
                        });
                    }
                    setServerError(t('errors.validation'));
                    return;
                }
                setServerError(
                    looksLikeBackendLeak(err)
                        ? t('errors.unknown')
                        : err.message || t('errors.unknown'),
                );
                return;
            }
            setServerError(t('errors.unknown'));
        }
    }

    if (success) {
        return (
            <div className="space-y-4 py-2 text-center">
                <h3 className="font-heading text-2xl font-medium tracking-tight">
                    {t('success.title')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('success.body')}</p>
                {onSuccess && (
                    <Button onClick={onSuccess} className="mx-auto">
                        {t('success.close')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {serverError && (
                    <div
                        role="alert"
                        className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                        {serverError}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fields.name')}</FormLabel>
                                <FormControl>
                                    <Input
                                        autoComplete="name"
                                        placeholder={t('fields.namePlaceholder')}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fields.phone')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder={t('fields.phonePlaceholder')}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.email')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    autoComplete="email"
                                    placeholder={t('fields.emailPlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.message')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={3}
                                    placeholder={t('fields.messagePlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <button
                    type="button"
                    onClick={() => setShowDetails((s) => !s)}
                    className="flex w-full items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40"
                    aria-expanded={showDetails}
                >
                    <span>{t('toggles.showDetails')}</span>
                    <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    />
                </button>

                {showDetails && (
                    <div className="space-y-5">
                        <LeadSourceRadio control={form.control} />
                        <InterestTagsChecks control={form.control} />
                        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-4">
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {t('location.title')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t('location.hint')}
                                </p>
                            </div>
                            <AddressPicker
                                value={{
                                    latitude: interestLat ?? null,
                                    longitude: interestLng ?? null,
                                }}
                                onChange={handleInterestLocation}
                            />
                        </div>
                    </div>
                )}

                {!authenticated && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
                        <Checkbox
                            checked={!!createAccount}
                            onCheckedChange={(checked) => {
                                const value = checked === true;
                                form.setValue('createAccount', value, { shouldValidate: false });
                                if (!value) {
                                    form.setValue('fillInterestProfile', false);
                                    form.setValue('password', '');
                                    form.setValue('confirmPassword', '');
                                }
                            }}
                        />
                        <span className="leading-tight text-foreground">
                            {t('toggles.createAccount')}
                        </span>
                    </label>
                )}

                {createAccount && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('fields.password')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder={t('fields.passwordPlaceholder')}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('fields.confirmPassword')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder={t('fields.passwordPlaceholder')}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <label
                            className={`flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm ${
                                createAccount ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                            }`}
                        >
                            <Checkbox
                                disabled={!createAccount}
                                checked={!!fillInterestProfile}
                                onCheckedChange={(checked) =>
                                    form.setValue('fillInterestProfile', checked === true, {
                                        shouldValidate: false,
                                    })
                                }
                            />
                            <span className="leading-tight text-foreground">
                                {t('toggles.fillInterestProfile')}
                            </span>
                        </label>
                    </TooltipTrigger>
                    {!createAccount && (
                        <TooltipContent>{t('toggles.requiresAccount')}</TooltipContent>
                    )}
                </Tooltip>

                {createAccount && fillInterestProfile && (
                    <InterestProfileFields form={profileForm} />
                )}

                <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start gap-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={!!field.value}
                                    onCheckedChange={(checked) => field.onChange(checked === true)}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-tight">
                                <FormLabel className="text-sm font-normal text-foreground">
                                    {t('fields.acceptTerms')}{' '}
                                    <Link
                                        href="/termos"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {t('fields.termsLink')}
                                    </Link>
                                </FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                >
                    {form.formState.isSubmitting ? t('submitting') : t('submit')}
                </Button>
            </form>
        </Form>
    );
}
