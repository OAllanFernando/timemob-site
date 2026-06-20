import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const SUPPORTED_LOCALES = ['pt', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'pt';

function resolveLocale(value: string | undefined): Locale {
    if (value && (SUPPORTED_LOCALES as readonly string[]).includes(value)) {
        return value as Locale;
    }
    return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
    const store = await cookies();
    const locale = resolveLocale(store.get('NEXT_LOCALE')?.value);

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { Locale };
