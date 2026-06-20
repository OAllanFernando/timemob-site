export interface IUser {
    id: number;
    login: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
    activated?: boolean;
    langKey?: string;
    authorities?: string[];
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
    authenticated: boolean;
    loading: boolean;
    login: (data: ILoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}
