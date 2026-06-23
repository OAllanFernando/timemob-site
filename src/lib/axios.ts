import axios from 'axios';

export const TOKEN_STORAGE_KEY = '@site/token';
export const UNAUTHORIZED_EVENT = 'site:unauthorized';
export const TENANT_ID_HEADER = 'X-Tenant-Id';
export const TENANT_SLUG_HEADER = 'X-Tenant-Slug';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 1000000,
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;
    if (tenantSlug) {
        config.headers[TENANT_SLUG_HEADER] = tenantSlug;
    }
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId) {
        config.headers[TENANT_ID_HEADER] = tenantId;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            typeof window !== 'undefined' &&
            error?.response?.status === 401
        ) {
            const url: string = error?.config?.url ?? '';
            const isLoginAttempt = url.includes('/site/authenticate');
            if (!isLoginAttempt) {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
            }
        }
        return Promise.reject(error);
    },
);
