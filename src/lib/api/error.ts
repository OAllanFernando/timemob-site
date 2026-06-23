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

// =============================================================================
// Conflict detectors — when the back leaks a raw constraint name in the error
// message instead of returning a clean 409 + errorKey, we fall back to string
// matching the constraint name. Remove the message-based checks once the back
// catches DataIntegrityViolationException properly.
// =============================================================================

const CPF_CONSTRAINT = 'ux_customer__natural_person_document';
const CNPJ_CONSTRAINT = 'ux_customer__entity_document';

function errorMessageOf(err: unknown): string {
    if (err instanceof DomainError) return err.message ?? '';
    if (err instanceof Error) return err.message ?? '';
    return '';
}

export function isEmailConflict(err: unknown): boolean {
    if (!(err instanceof DomainError)) return false;
    if (err.code === 'conflict') return true;
    const key = err.errorKey ?? '';
    return key.includes('userexists') || key.includes('emailexists');
}

export function isCpfConflict(err: unknown): boolean {
    if (!(err instanceof DomainError)) return false;
    const key = err.errorKey ?? '';
    if (key.includes('cpfexists') || key.includes('naturalpersondocument')) return true;
    return errorMessageOf(err).includes(CPF_CONSTRAINT);
}

export function isCnpjConflict(err: unknown): boolean {
    if (!(err instanceof DomainError)) return false;
    const key = err.errorKey ?? '';
    if (key.includes('cnpjexists') || key.includes('entitydocument')) return true;
    return errorMessageOf(err).includes(CNPJ_CONSTRAINT);
}

const SQL_LEAK_FRAGMENTS = [
    'could not execute',
    'violates unique constraint',
    'violates foreign key',
    'duplicate key value',
    'org.hibernate',
    'org.postgresql',
    'org.springframework',
    'JpaSystemException',
    'DataIntegrityViolationException',
    'SQLException',
];

/**
 * Returns true when the error message looks like a raw back-end stack/SQL
 * leak rather than a user-safe message. Use this to decide whether to surface
 * `err.message` to the user (clean) or swap for a generic fallback (leaked).
 */
export function looksLikeBackendLeak(err: unknown): boolean {
    const message = errorMessageOf(err);
    if (!message) return false;
    return SQL_LEAK_FRAGMENTS.some((frag) => message.includes(frag));
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
