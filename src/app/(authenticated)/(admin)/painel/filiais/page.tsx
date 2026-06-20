import { getTranslations } from 'next-intl/server';

import { PlaceholderCard } from '@/components/layout/placeholder-card';

export default async function AdminBranchesPage() {
    const tNav = await getTranslations('nav.admin');
    const tPlaceholder = await getTranslations('pages.placeholder');

    return (
        <div className="space-y-6">
            <h1 className="font-heading text-3xl font-medium tracking-tight">
                {tNav('branches')}
            </h1>
            <PlaceholderCard title={tPlaceholder('title')} body={tPlaceholder('body')} />
        </div>
    );
}
