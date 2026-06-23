import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LoginRedirect({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const qs = new URLSearchParams();
    qs.set('tab', 'login');
    for (const [key, value] of Object.entries(params)) {
        if (key === 'tab') continue;
        if (typeof value === 'string') qs.set(key, value);
    }
    redirect(`/entrar?${qs.toString()}`);
}
