'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { SUPPORTED_LOCALES, type Locale } from '@/i18n/request';

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function setLocale(locale: string) {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) return;

    const store = await cookies();
    store.set('NEXT_LOCALE', locale as Locale, {
        path: '/',
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: 'lax',
    });

    revalidatePath('/', 'layout');
}
