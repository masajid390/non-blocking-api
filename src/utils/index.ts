import z, { ZodError } from "zod";

export function formatZodError(error: ZodError) {
    return error.issues.reduce<Record<string, string[]>>(
        (acc, issue: z.core.$ZodIssue) => {
            const path = issue.path.join(".");
            if (!path) return acc; // skip root-level errors

            // Create a new object with the updated path key
            return {
                ...acc,
                [path]: [...(acc[path] ?? []), issue.message],
            };
        },
        {}
    )
};

export function getfastifyEnvOptions() {
    const schema = {
        type: 'object',
        required: ['JSON_PLACEHOLDER_API_URL'],
        properties: {
            PORT: { type: 'string', default: '3000' },
            JSON_PLACEHOLDER_API_URL: { type: 'string' },
            NODE_ENV: { type: 'string', default: 'development' },
        },
    } as const;

    const options: { confKey: string; schema: typeof schema; dotenv: boolean } = {
        confKey: 'config', // optional, default: 'config'
        schema,
        dotenv: true,
    };

    return options
}

// Lightweight HTTP error with status code so callers (and retry) can react
export class HttpError extends Error {
    status: number;
    constructor(status: number, message?: string) {
        super(message ?? `HTTP ${status}`);
        this.name = 'HttpError';
        this.status = status;
    }
}

/** Helper to fetch and JSON-decode a URL with timeout, throwing on non-OK responses */
export async function fetchJson<T = unknown>(url: string, timeout = 5000): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            // Throw structured HttpError so retry logic can skip 4xx
            throw new HttpError(response.status, `fetchJson failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    } finally {
        clearTimeout(id);
    }
}

export async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            // Don't retry on HTTP client errors (4xx)
            if (err instanceof HttpError && err.status >= 400 && err.status < 500) {
                throw err;
            }
            if (attempt >= retries) throw err;
            await new Promise((res) => setTimeout(res, delayMs));
        }
    }
    throw new Error('Retry attempts exceeded');
}
