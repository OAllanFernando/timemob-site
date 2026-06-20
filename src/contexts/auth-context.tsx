'use client';

import { createContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from '@/lib/axios';
import { hasSiteAudience, readSiteJwtClaims } from '@/lib/auth/jwt-claims';
import { authService } from '@/services/auth-service';
import { userService } from '@/services/user-service';
import { DomainError } from '@/types/domain-response';
import { IAuthContext, ILoginRequest, IUser } from '@/types/auth';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

export const AuthContext = createContext({} as IAuthContext);

interface Props {
    children: ReactNode;
}

function readStoredToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function discardStaleAudienceToken() {
    if (typeof window === 'undefined') return;
    const claims = readSiteJwtClaims();
    if (claims && !hasSiteAudience(claims)) {
        console.warn('[auth] token audience mismatch, discarding');
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

export function AuthProvider({ children }: Props) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: user, isPending } = useQuery<IUser | null>({
        queryKey: AUTH_ME_KEY,
        queryFn: async () => {
            discardStaleAudienceToken();
            if (!readStoredToken()) return null;
            try {
                const res = await userService.getMe();
                return res.data;
            } catch (error) {
                if (error instanceof DomainError && error.code === 'unauthorized') {
                    return null;
                }
                throw error;
            }
        },
        retry: false,
        staleTime: Infinity,
    });

    async function login(data: ILoginRequest) {
        const res = await authService.login(data);
        localStorage.setItem(TOKEN_STORAGE_KEY, res.data.id_token);
        queryClient.removeQueries({
            predicate: (query) => query.queryKey[0] !== 'auth',
        });
        const userRes = await userService.getMe();
        queryClient.setQueryData(AUTH_ME_KEY, userRes.data);
    }

    async function logout() {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        queryClient.setQueryData(AUTH_ME_KEY, null);
        queryClient.removeQueries();
        router.push('/login');
    }

    useEffect(() => {
        function handleUnauthorized() {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            queryClient.setQueryData(AUTH_ME_KEY, null);
            queryClient.removeQueries();
            router.push('/login');
        }
        window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
        return () => {
            window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
        };
    }, [queryClient, router]);

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                loading: isPending,
                authenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
