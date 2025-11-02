export enum ErrorCode {
    // 4xx
    INVALID_PARAMETER = 'INVALID_PARAMETER',

    // 5xx
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    UPSTREAM_INVALID_RESPONSE = 'UPSTREAM_INVALID_RESPONSE',
}

export type ErrorResponse = {
    message: string;
    code: ErrorCode;
    details?: Record<string, string[]>;
}