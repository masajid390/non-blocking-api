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
        required: ['PORT', 'JSON_PLACEHOLDER_API_URL'],
        properties: {
            PORT: { type: 'string', default: '3000' },
            JSON_PLACEHOLDER_API_URL: { type: 'string' },
        },
    } as const;

    const options: { confKey: string; schema: typeof schema; dotenv: boolean } = {
        confKey: 'config', // optional, default: 'config'
        schema,
        dotenv: true,
    };

    return options
}

/** Helper to fetch and JSON-decode a URL, throwing on non-OK responses */
export async function fetchJson<T = unknown>(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`fetchJson failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
}

export async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            if (attempt >= retries) throw err;
            await new Promise((res) => setTimeout(res, delayMs));
        }
    }
    throw new Error('Retry attempts exceeded');
}
