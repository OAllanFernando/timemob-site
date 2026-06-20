import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';

export default async function PublicCatalogPage() {
    const t = await getTranslations('pages.catalog');

    return (
        <div className="space-y-6 text-center">
            <h1 className="font-heading text-4xl font-medium tracking-tight md:text-5xl">
                {t('title')}
            </h1>
            <p className="text-balance text-base text-muted-foreground md:text-lg">
                {t('body')}
            </p>
            <div className="flex justify-center pt-2">
                <Button asChild size="lg" variant="outline">
                    <Link href="/">{t('back')}</Link>
                </Button>
            </div>
        </div>
    );
}
