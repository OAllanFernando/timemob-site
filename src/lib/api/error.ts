import { AxiosError } from 'axios';

import {
    DomainError,
    type DomainErrorCode,
    type FieldErrorMap,
} from '@/types/domain-response';

export function getErrorKey(err: unknown): string | null {
    if (err instanceof DomainError) return err.errorKey ?? null;
    return null;
}

export function isErrorKey(err: unknown, key: string): boolean {
    const raw = getErrorKey(err);
    if (!raw) return false;
    return raw === key || raw === `error.${key}`;
}

interface JhipsterFieldError {
    objectName?: string;
    field?: string;
    message?: string;
}

interface JhipsterProblem {
    title?: string;
    detail?: string;
    message?: string;
    fieldErrors?: JhipsterFieldError[];
}

function codeForStatus(status: number): DomainErrorCode {
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status === 400 || status === 422) return 'validation';
    if (status >= 500) return 'server';
    return 'unknown';
}

function extractFieldErrors(payload: JhipsterProblem | undefined): FieldErrorMap | undefined {
    if (!payload?.fieldErrors?.length) return undefined;
    const map: FieldErrorMap = {};
    for (const fe of payload.fieldErrors) {
        if (!fe.field || !fe.message) continue;
        if (!map[fe.field]) map[fe.field] = [];
        map[fe.field].push(fe.message);
    }
    return Object.keys(map).length > 0 ? map : undefined;
}

export function toDomainError(err: unknown): DomainError {
    if (err instanceof DomainError) return err;

    if (err instanceof AxiosError) {
        if (!err.response) {
            return new DomainError('network', err.message || 'Falha de rede', null);
        }
        const status = err.response.status;
        const payload = err.response.data as JhipsterProblem | undefined;
        const code = codeForStatus(status);
        const errorKey =
            typeof payload?.message === 'string' && payload.message.startsWith('error.')
                ? payload.message
                : undefined;
        const message = payload?.detail ?? payload?.title ?? err.message ?? 'Erro';
        return new DomainError(code, message, status, errorKey, extractFieldErrors(payload));
    }

    if (err instanceof Error) {
        return new DomainError('unknown', err.message, null);
    }

    return new DomainError('unknown', 'Erro desconhecido', null);
}
