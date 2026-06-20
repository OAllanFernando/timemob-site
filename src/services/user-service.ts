import { api } from '@/lib/axios';
import { toDomainError } from '@/lib/api/error';
import { toResponse } from '@/lib/api/response';
import type { IUser } from '@/types/auth';
import type { DomainResponse } from '@/types/domain-response';

class UserService {
    async getMe(): Promise<DomainResponse<IUser>> {
        try {
            return toResponse(await api.get<IUser>('/account'));
        } catch (err) {
            throw toDomainError(err);
        }
    }
}

export const userService = new UserService();
