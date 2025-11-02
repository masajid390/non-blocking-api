/*
 Generates OpenAPI 3.0 document for the /api/user/{userId} endpoint.
 Writes openapi/openapi.json
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Build OpenAPI components manually based on Zod schemas in src/schemas/user-schema.ts
// This avoids version-mismatch issues between Zod v4 and codegen libraries.

const components = {
    schemas: {
        // Success response schema
        UserResponse: {
            type: 'object',
            required: ['user', 'posts'],
            properties: {
                user: {
                    type: 'object',
                    required: ['id', 'name', 'username', 'email', 'address', 'phone', 'website', 'company'],
                    properties: {
                        id: { type: 'number', example: 1 },
                        name: { type: 'string', example: 'Leanne Graham' },
                        username: { type: 'string', example: 'Bret' },
                        email: { type: 'string', format: 'email', example: 'Sincere@april.biz' },
                        address: {
                            type: 'object',
                            required: ['street', 'suite', 'city', 'zipcode'],
                            properties: {
                                street: { type: 'string', example: 'Kulas Light' },
                                suite: { type: 'string', example: 'Apt. 556' },
                                city: { type: 'string', example: 'Gwenborough' },
                                zipcode: { type: 'string', example: '92998-3874' },
                            },
                        },
                        phone: { type: 'string', example: '1-770-736-8031 x56442' },
                        website: { type: 'string', example: 'hildegard.org' },
                        company: {
                            type: 'object',
                            required: ['name', 'catchPhrase', 'bs'],
                            properties: {
                                name: { type: 'string', example: 'Romaguera-Crona' },
                                catchPhrase: { type: 'string', example: 'Multi-layered client-server neural-net' },
                                bs: { type: 'string', example: 'harness real-time e-markets' },
                            },
                        },
                    },
                },
                posts: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['userId', 'id', 'title', 'body'],
                        properties: {
                            userId: { type: 'number', example: 1 },
                            id: { type: 'number', example: 1 },
                            title: { type: 'string', example: 'sunt aut facere repellat' },
                            body: { type: 'string', example: 'quia et suscipit suscipit recusandae' },
                        },
                    },
                },
            },
        },
        // Unified error response schema (covers 400, 429, 500, 502)
        ErrorResponse: {
            type: 'object',
            properties: {
                error: {
                    type: 'string',
                    description: 'Error message describing what went wrong',
                    example: 'Invalid User ID parameter',
                },
                details: {
                    type: 'object',
                    description: 'Optional validation details (present for 400 and 502)',
                    additionalProperties: { type: 'array', items: { type: 'string' } },
                    example: { userId: ['Expected number, received string'] },
                },
                statusCode: {
                    type: 'integer',
                    description: 'HTTP status code (present for 429)',
                    example: 429,
                },
                message: {
                    type: 'string',
                    description: 'Additional message (present for 429)',
                    example: 'Rate limit exceeded, retry later',
                },
            },
            required: ['error'],
            example: {
                error: 'Invalid User ID parameter',
                details: { userId: ['Expected number, received string'] },
            },
        },
    },
} as const; const document = {
    openapi: '3.0.3',
    info: {
        title: 'Non-Blocking API - User Service',
        version: '1.0.0',
        description:
            'OpenAPI spec for /api/user/{userId}. Generated from current Zod schemas and route behavior (including error responses).',
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local dev' },
    ],
    paths: {
        '/api/user/{userId}': {
            get: {
                summary: 'Get user with posts',
                description: 'Get a user and their posts from JSONPlaceholder, with SWR caching',
                parameters: [
                    {
                        name: 'userId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer', minimum: 1 },
                        description: 'User ID (positive integer)',
                        example: 1,
                    },
                ],
                responses: {
                    '200': {
                        description: 'Successful response with user and posts',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } },
                    },
                    '400': {
                        description: 'Invalid User ID parameter (validation failed)',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                                example: {
                                    error: 'Invalid User ID parameter',
                                    details: { userId: ['Expected number, received string'] },
                                },
                            },
                        },
                    },
                    '429': {
                        description: 'Too many requests (rate limit exceeded)',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                                example: {
                                    statusCode: 429,
                                    error: 'Too Many Requests',
                                    message: 'Rate limit exceeded, retry later',
                                },
                            },
                        },
                    },
                    '500': {
                        description: 'Failed to fetch user data (upstream failure or unexpected error)',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                                example: { error: 'Failed to fetch user data' },
                            },
                        },
                    },
                    '502': {
                        description: 'Failed to validate user data (response schema validation failed)',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                                example: {
                                    error: 'Failed to validate user data',
                                    details: { 'user.email': ['Invalid email'] },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    components,
};

const outDir = join(process.cwd(), 'openapi');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'openapi.json');
writeFileSync(outFile, JSON.stringify(document, null, 2));

console.log(`OpenAPI document written to ${outFile}`);
