import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import React from 'react';

import './globals.css';

import { AppProvider } from '@/providers/app-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});

const fraunces = Fraunces({
    variable: '--font-fraunces',
    subsets: ['latin'],
    display: 'swap',
    axes: ['opsz'],
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains-mono',
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'TimeMob Site',
    description: 'Site da sua imobiliária',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html
            lang={locale}
            suppressHydrationWarning
            className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <QueryProvider>
                    <ThemeProvider>
                        <NextIntlClientProvider locale={locale} messages={messages}>
                            <AppProvider>{children}</AppProvider>
                        </NextIntlClientProvider>
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
