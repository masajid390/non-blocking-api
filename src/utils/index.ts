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
