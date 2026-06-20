'use client';

import { useAuth } from '@/hooks/use-auth';
import { resolveProfileRole, type ProfileRole } from '@/lib/auth/roles';

export function useUserRole(): ProfileRole {
    const { user } = useAuth();
    return resolveProfileRole(user?.authorities);
}
