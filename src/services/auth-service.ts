import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse } from '@/lib/api/response';
import type { IAuthenticateResponse, ILoginRequest } from '@/types/auth';
import type { DomainResponse } from '@/types/domain-response';

class AuthService {
    async login(data: ILoginRequest): Promise<DomainResponse<IAuthenticateResponse>> {
        try {
            return toResponse(await api.post<IAuthenticateResponse>('/site/authenticate', data));
        } catch (err) {
            throw toDomainError(err);
        }
    }
}

export const authService = new AuthService();
