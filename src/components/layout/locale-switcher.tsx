'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

import { setLocale } from '@/app/actions/locale';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALES = [
    { code: 'pt', key: 'pt' as const },
    { code: 'en', key: 'en' as const },
];

export function LocaleSwitcher() {
    const t = useTranslations('locale');
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    function changeLocale(next: string) {
        if (next === locale) return;
        startTransition(() => {
            void setLocale(next);
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('switch')} disabled={isPending}>
                    <Globe className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LOCALES.map((l) => (
                    <DropdownMenuItem
                        key={l.code}
                        onSelect={() => changeLocale(l.code)}
                        data-active={locale === l.code}
                        className="data-[active=true]:font-semibold"
                    >
                        {t(l.key)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
