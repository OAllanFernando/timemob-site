export interface IUser {
    id: number;
    login: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    imageUrl?: string | null;
    activated?: boolean;
    langKey?: string | null;
    authorities?: string[];
    createdBy?: string | null;
    createdDate?: string | null;
    lastModifiedBy?: string | null;
    lastModifiedDate?: string | null;
    creciNumber?: string | null;
    agencyCreciNumber?: string | null;
}

export interface ILoginRequest {
    username: string;
    password: string;
    rememberMe?: boolean;
}

export interface IAuthenticateResponse {
    id_token: string;
}

export interface IAuthContext {
    user: IUser | null;
    role: import('./team').SiteRole | null;
    /** Populated when role === 'CUSTOMER'. */
    customer: import('./customer').ICustomer | null;
    /** Populated when role === 'CUSTOMER'. Empty array otherwise. */
    memberships: import('./customer').ICustomerMembership[];
    /** Populated when role === 'MANAGER'. */
    manager: import('./team').IManager | null;
    /** Populated when role === 'AGENT'. */
    agent: import('./team').IRealEstateAgent | null;
    /** Populated when role === 'CUSTOMER' — carries the cross-tenant flag. */
    currentTenant: import('./customer').ICurrentTenantInfo | null;
    /** True iff CUSTOMER logged-in but NOT yet member of this site's tenant. */
    crossTenant: boolean;
    authenticated: boolean;
    loading: boolean;
    login: (data: ILoginRequest) => Promise<void>;
    register: (data: import('./customer').ICustomerRegistrationRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshAccount: () => Promise<void>;
}
