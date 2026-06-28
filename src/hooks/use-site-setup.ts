'use client';

import { useQuery } from '@tanstack/react-query';

import { siteService } from '@/services/site-service';
import type { ISiteSetup } from '@/types/customer';

const SITE_SETUP_KEY = ['site-setup'] as const;
const HOUR = 60 * 60 * 1000;

/**
 * White-label bootstrap (agency identity + logo + contact + branches) for the current tenant.
 * Tenant-scoped per build, so it rarely changes — cached aggressively. Failures resolve to
 * `undefined` data and consumers fall back to the build-time name + i18n placeholders.
 */
export function useSiteSetup() {
    return useQuery<ISiteSetup>({
        queryKey: SITE_SETUP_KEY,
        queryFn: async () => {
            const res = await siteService.getSetup();
            return res.data;
        },
        staleTime: HOUR,
        gcTime: HOUR,
        retry: false,
    });
}
