'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { BrandLogo } from '@/components/brand/brand-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { LoginTab } from './components/login-tab';
import { RegisterTab } from './components/register-tab';

type TabValue = 'login' | 'register';

function parseTab(value: string | null): TabValue {
    return value === 'register' ? 'register' : 'login';
}

function EntrarContent() {
    const t = useTranslations('auth');
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<TabValue>(parseTab(searchParams.get('tab')));

    return (
        <Card className="w-full border-border/70 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur">
            <CardHeader className="space-y-3 px-8 pt-8 text-center">
                <BrandLogo className="mx-auto" height={44} />
                <CardTitle className="font-heading text-3xl font-medium tracking-tight">
                    {tab === 'login' ? t('login.title') : t('register.title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    {tab === 'login' ? t('login.subtitle') : t('register.subtitle')}
                </p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full">
                    <TabsList className="mb-6 grid w-full grid-cols-2">
                        <TabsTrigger value="login">{t('tabs.login')}</TabsTrigger>
                        <TabsTrigger value="register">{t('tabs.register')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <LoginTab onSwitchToRegister={() => setTab('register')} />
                    </TabsContent>
                    <TabsContent value="register">
                        <RegisterTab onSwitchToLogin={() => setTab('login')} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default function EntrarPage() {
    return (
        <Suspense fallback={null}>
            <EntrarContent />
        </Suspense>
    );
}
