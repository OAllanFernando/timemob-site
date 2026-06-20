import { getTranslations } from 'next-intl/server';

import { PlaceholderCard } from '@/components/layout/placeholder-card';

export default async function ClientProfilePage() {
    const tNav = await getTranslations('nav.client');
    const tPlaceholder = await getTranslations('pages.placeholder');

    return (
        <div className="space-y-6">
            <h1 className="font-heading text-3xl font-medium tracking-tight">
                {tNav('profile')}
            </h1>
            <PlaceholderCard title={tPlaceholder('title')} body={tPlaceholder('body')} />
        </div>
    );
}
