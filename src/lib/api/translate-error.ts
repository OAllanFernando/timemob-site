import type { useTranslations } from 'next-intl';

import { DomainError } from '@/types/domain-response';

type Translator = ReturnType<typeof useTranslations>;

export function translateDomainError(err: unknown, t: Translator): string {
    if (err instanceof DomainError) {
        if (err.errorKey && t.has(err.errorKey)) return t(err.errorKey);
        return t(err.code);
    }
    return t('unknown');
}
