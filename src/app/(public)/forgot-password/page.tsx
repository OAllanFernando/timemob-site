import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ForgotPasswordPage() {
    const t = await getTranslations('auth.forgotPassword');
    const tBrand = await getTranslations('brand');

    return (
        <Card className="w-full border-border/70 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur">
            <CardHeader className="space-y-3 px-8 pt-8 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                    {tBrand('name')}
                </p>
                <CardTitle className="font-heading text-3xl font-medium tracking-tight">
                    {t('title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <Button asChild size="lg" variant="outline" className="w-full">
                    <Link href="/login">{t('back')}</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
