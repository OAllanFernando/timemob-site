'use client';

import { useTranslations } from 'next-intl';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { LeadCaptureForm, type LeadCaptureFormProps } from './lead-capture-form';

interface Props extends LeadCaptureFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LeadCaptureModal({ open, onOpenChange, ...formProps }: Props) {
    const t = useTranslations('lead.modal');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl font-medium tracking-tight">
                        {t('title')}
                    </DialogTitle>
                    <DialogDescription>{t('subtitle')}</DialogDescription>
                </DialogHeader>
                <LeadCaptureForm
                    {...formProps}
                    onSuccess={() => {
                        formProps.onSuccess?.();
                        onOpenChange(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
