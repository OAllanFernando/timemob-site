'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';
import { customerService } from '@/services/customer-service';
import { toRegistrationRequest } from '@/lib/transformers/registration';
import { registerSchema, type RegisterInput } from '@/lib/schemas/register';
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
import { Form } from '@/components/ui/form';
import { DomainError } from '@/types/domain-response';

import { RegisterFields } from './register-fields';
import { RegisterAddressFields } from './register-address-fields';
import { InterestProfileFields } from './interest-profile-fields';

interface Props {
    onSwitchToLogin?: () => void;
}

export function RegisterTab({ onSwitchToLogin }: Props) {
    const t = useTranslations('auth.register');
    const tTabs = useTranslations('auth.tabs');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register: registerCustomer } = useAuth();

    const registerForm = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            phoneNumber: '',
            naturalPersonDocument: '',
            postalCode: '',
            streetName: '',
            number: '',
            complement: '',
            latitude: null,
            longitude: null,
            password: '',
            confirmPassword: '',
            acceptTerms: false as unknown as true,
            acceptContact: true,
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

    const fillInterestProfile = registerForm.watch('fillInterestProfile');
    const acceptContact = registerForm.watch('acceptContact');
    const [serverError, setServerError] = useState<string | null>(null);

    async function onSubmit(values: RegisterInput) {
        setServerError(null);
        try {
            await registerCustomer(toRegistrationRequest(values));

            if (values.fillInterestProfile) {
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

            toast.success(t('success'));
            const next = searchParams.get('next') ?? '/dashboard';
            router.replace(next);
        } catch (err) {
            if (isEmailConflict(err)) {
                toast.error(t('errors.emailExists'));
                registerForm.setError('email', {
                    type: 'server',
                    message: t('errors.emailExists'),
                });
                setServerError(t('errors.emailExists'));
                return;
            }
            if (isCpfConflict(err)) {
                toast.error(t('errors.cpfExists'));
                registerForm.setError('naturalPersonDocument', {
                    type: 'server',
                    message: t('errors.cpfExists'),
                });
                return;
            }
            if (isCnpjConflict(err)) {
                toast.error(t('errors.cnpjExists'));
                setServerError(t('errors.cnpjExists'));
                return;
            }
            if (err instanceof DomainError) {
                if (err.code === 'network') {
                    setServerError(t('errors.network'));
                    return;
                }
                if (err.fieldErrors) {
                    for (const [field, messages] of Object.entries(err.fieldErrors)) {
                        registerForm.setError(field as keyof RegisterInput, {
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

    return (
        <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onSubmit)} className="space-y-5">
                {serverError && (
                    <div
                        role="alert"
                        className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                        {serverError}
                    </div>
                )}

                <RegisterFields control={registerForm.control} />

                <RegisterAddressFields form={registerForm} />

                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
                    <Checkbox
                        checked={!!acceptContact}
                        onCheckedChange={(checked) =>
                            registerForm.setValue('acceptContact', checked === true, {
                                shouldValidate: false,
                            })
                        }
                    />
                    <span className="leading-tight text-foreground">
                        {t('acceptContactToggle')}
                    </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
                    <Checkbox
                        checked={!!fillInterestProfile}
                        onCheckedChange={(checked) =>
                            registerForm.setValue('fillInterestProfile', checked === true, {
                                shouldValidate: false,
                            })
                        }
                    />
                    <span className="leading-tight text-foreground">
                        {t('fillInterestProfileToggle')}
                    </span>
                </label>

                {fillInterestProfile && <InterestProfileFields form={profileForm} />}

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={registerForm.formState.isSubmitting}
                >
                    {registerForm.formState.isSubmitting ? t('submitting') : t('submit')}
                </Button>

                {onSwitchToLogin && (
                    <p className="text-center text-sm text-muted-foreground">
                        {t('hasAccount')}{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-primary hover:underline"
                        >
                            {tTabs('login')}
                        </button>
                    </p>
                )}
            </form>
        </Form>
    );
}
