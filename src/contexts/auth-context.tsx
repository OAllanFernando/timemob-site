'use client';

import { createContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from '@/lib/axios';
import { hasSiteAudience, readSiteJwtClaims } from '@/lib/auth/jwt-claims';
import { authService } from '@/services/auth-service';
import { customerService } from '@/services/customer-service';
import { DomainError } from '@/types/domain-response';
import { IAuthContext, ILoginRequest } from '@/types/auth';
import type {
    ICustomerRegistrationRequest,
    IMyAccountResponse,
} from '@/types/customer';

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

    const { data: account, isPending } = useQuery<IMyAccountResponse | null>({
        queryKey: AUTH_ME_KEY,
        queryFn: async () => {
            discardStaleAudienceToken();
            if (!readStoredToken()) return null;
            try {
                const res = await customerService.getMe();
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
        const accountRes = await customerService.getMe();
        queryClient.setQueryData(AUTH_ME_KEY, accountRes.data);
    }

    async function register(data: ICustomerRegistrationRequest) {
        await customerService.register(data);
        await login({
            username: data.email,
            password: data.password,
            rememberMe: true,
        });
    }

    async function logout() {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        queryClient.setQueryData(AUTH_ME_KEY, null);
        queryClient.removeQueries();
        router.push('/entrar');
    }

    async function refreshAccount() {
        const res = await customerService.getMe();
        queryClient.setQueryData(AUTH_ME_KEY, res.data);
    }

    useEffect(() => {
        function handleUnauthorized() {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            queryClient.setQueryData(AUTH_ME_KEY, null);
            queryClient.removeQueries();
            router.push('/entrar');
        }
        window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
        return () => {
            window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
        };
    }, [queryClient, router]);

    return (
        <AuthContext.Provider
            value={{
                user: account?.user ?? null,
                role: account?.role ?? null,
                customer: account?.customer ?? null,
                memberships: account?.memberships ?? [],
                manager: account?.manager ?? null,
                agent: account?.agent ?? null,
                currentTenant: account?.currentTenant ?? null,
                crossTenant:
                    account?.role === 'CUSTOMER' &&
                    account.currentTenant?.memberOfCurrentTenant === false,
                licenseActive: account?.licenseActive ?? null,
                loading: isPending,
                authenticated: !!account,
                login,
                register,
                logout,
                refreshAccount,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
