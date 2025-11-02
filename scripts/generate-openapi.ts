/*
 Automatically generates OpenAPI 3.0 document by introspecting Fastify routes.
 This script spins up a Fastify instance, registers all routes, and extracts
 their schemas dynamically. Works for ANY endpoint, no manual maintenance needed.
 
 Writes openapi/openapi.json
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import { getfastifyEnvOptions } from '../src/utils';

// Import all route modules
import userRoute from '../src/routes/user';

// Import schemas to use for documentation
import { userResponseSchema, userIdParamSchema } from '../src/schemas/user-schema';
import { z } from 'zod';

// Generic error response schema (matches src/types/index.ts ErrorResponse)
const errorResponseOpenAPISchema = {
    type: 'object',
    required: ['message', 'code'],
    properties: {
        message: { type: 'string' },
        code: {
            type: 'string',
            enum: ['INVALID_PARAMETER', 'INTERNAL_ERROR', 'UPSTREAM_INVALID_RESPONSE'],
        },
        details: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
        },
    },
} as const;

// Define route metadata (this maps routes to their schemas)
const routeMetadata: Record<string, { params?: any; response?: Record<string, any>; description?: string; tags?: string[] }> = {
    '/api/user/:userId': {
        description: 'Get user with their posts from JSONPlaceholder API',
        tags: ['Users'],
        params: userIdParamSchema,
        response: {
            '200': userResponseSchema,
            // Per-status error schemas with fixed code values
            '400': errorSchemaFor('INVALID_PARAMETER'),
            '500': errorSchemaFor('INTERNAL_ERROR'),
            '502': errorSchemaFor('UPSTREAM_INVALID_RESPONSE'),
        },
    },
    // Add more routes here as you create them
};

async function generateOpenAPISpec() {
    const server: FastifyInstance = Fastify({ logger: false });

    try {
        // Ensure required env vars exist for generation (no network calls are made)
        if (!process.env.JSON_PLACEHOLDER_API_URL) {
            process.env.JSON_PLACEHOLDER_API_URL = 'https://jsonplaceholder.typicode.com';
        }

        // Collect routes during registration
        const routes: any[] = [];
        server.addHook('onRoute', (routeOptions) => {
            routes.push(routeOptions);
        });

        await server.register(fastifyEnv, getfastifyEnvOptions());
        await server.register(userRoute, { prefix: '/api' });
        await server.ready();

        const paths: Record<string, any> = {};
        const components: Record<string, any> = { schemas: {} };

        for (const route of routes) {
            const { method, url, schema } = route;

            if (!method || method === 'HEAD' || !url.startsWith('/api')) {
                continue;
            }

            const openApiPath = toOpenApiPath(url);
            if (!paths[openApiPath]) paths[openApiPath] = {};

            // Get metadata for this route
            const metadata = routeMetadata[url] || {};

            const httpMethod = method.toLowerCase();
            const operation: any = {
                summary: metadata.description || schema?.summary || `${method} ${url}`,
                description: metadata.description || schema?.description || '',
                tags: metadata.tags || schema?.tags || [extractTagFromUrl(url)],
            };

            operation.parameters = metadata.params
                ? extractParameters(url, metadata.params)
                : schema?.params
                    ? extractParameters(url, schema.params)
                    : extractParametersFromUrl(url); if (schema?.querystring) {
                        const queryParams = extractQueryParameters(schema.querystring);
                        operation.parameters = [...(operation.parameters || []), ...queryParams];
                    }

            if (schema?.body) {
                operation.requestBody = {
                    required: true,
                    content: { 'application/json': { schema: convertSchemaToOpenAPI(schema.body) } },
                };
            }

            operation.responses = {};
            const responseSchemas = metadata.response || schema?.response;
            if (responseSchemas) {
                for (const [statusCode, responseSchema] of Object.entries(responseSchemas)) {
                    operation.responses[statusCode] = {
                        description: getResponseDescription(statusCode),
                        content: { 'application/json': { schema: convertSchemaToOpenAPI(responseSchema) } },
                    };
                }
            } else {
                operation.responses['200'] = {
                    description: 'Successful response',
                    content: { 'application/json': { schema: { type: 'object' } } },
                };
            } paths[openApiPath][httpMethod] = operation;
        }

        const port = Number(process.env.PORT) || Number((server as any)?.config?.PORT) || 3000;
        const document = {
            openapi: '3.0.3',
            info: {
                title: 'Non-Blocking API',
                version: '1.0.0',
                description: 'Auto-generated OpenAPI spec from Fastify routes.',
            },
            servers: [{ url: `http://localhost:${port}`, description: 'Local development server' }],
            paths,
            components,
        };

        const outDir = join(process.cwd(), 'openapi');
        mkdirSync(outDir, { recursive: true });
        const outFile = join(outDir, 'openapi.json');
        writeFileSync(outFile, JSON.stringify(document, null, 2));

        console.log(`✓ OpenAPI spec generated from ${Object.keys(paths).length} route(s)`);
        console.log(`✓ Written to ${outFile}`);

        await server.close();
        process.exit(0);
    } catch (error) {
        console.error('Failed to generate OpenAPI spec:', error);
        await server.close();
        process.exit(1);
    }
}

// Convert Fastify/Express style :param to OpenAPI {param}
function toOpenApiPath(url: string): string {
    return url.replace(/:(\w+)/g, '{$1}');
}

function extractTagFromUrl(url: string): string {
    const parts = url.split('/').filter(p => p && !p.startsWith(':'));
    return parts.length > 1 ? capitalize(parts[1]) : 'Default';
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function extractParametersFromUrl(url: string): any[] {
    const params: any[] = [];
    const paramMatches = url.matchAll(/:(\w+)/g);
    for (const match of paramMatches) {
        params.push({ name: match[1], in: 'path', required: true, schema: { type: 'string' } });
    }
    return params;
}

function extractParameters(url: string, paramsSchema: any): any[] {
    const params: any[] = [];
    const paramNames = Array.from(url.matchAll(/:(\w+)/g)).map(m => m[1]);
    // If paramsSchema is a Zod object, convert to JSON schema first
    let jsonSchema: any = paramsSchema;
    if (paramsSchema && paramsSchema._def) {
        const inferred = inferSchemaFromZod(paramsSchema);
        if (inferred && inferred.properties) jsonSchema = inferred;
    }

    for (const paramName of paramNames) {
        const param: any = { name: paramName, in: 'path', required: true, schema: { type: 'string' } };
        const candidate = jsonSchema?.properties?.[paramName];
        if (candidate) {
            param.schema = candidate;
        }
        params.push(param);
    }
    return params;
}

function extractQueryParameters(querySchema: any): any[] {
    const params: any[] = [];
    if (querySchema?.properties) {
        for (const [name, schema] of Object.entries(querySchema.properties)) {
            params.push({
                name,
                in: 'query',
                required: querySchema.required?.includes(name) || false,
                schema: convertSchemaToOpenAPI(schema),
            });
        }
    }
    return params;
}

function convertSchemaToOpenAPI(schema: any): any {
    if (!schema) return { type: 'object' };
    // Check for Zod schema FIRST (before checking .type property)
    if (schema._def) return inferSchemaFromZod(schema);
    // If it's already a JSON Schema-like object, use it
    if (schema.type && typeof schema.type === 'string') return schema;
    return { type: 'object' };
}

// Build an ErrorResponse schema with a fixed code for a given status
function errorSchemaFor(code: 'INVALID_PARAMETER' | 'INTERNAL_ERROR' | 'UPSTREAM_INVALID_RESPONSE') {
    return {
        type: 'object',
        required: ['message', 'code'],
        properties: {
            message: { type: 'string' },
            code: { type: 'string', enum: [code] },
            details: {
                type: 'object',
                additionalProperties: { type: 'array', items: { type: 'string' } },
            },
        },
        example:
            code === 'INVALID_PARAMETER'
                ? { code, message: 'Invalid parameter', details: { userId: ['Expected positive number'] } }
                : code === 'INTERNAL_ERROR'
                    ? { code, message: 'Failed to fetch user data' }
                    : { code, message: 'Failed to validate user data', details: { user: ['Invalid structure'] } },
    } as const;
}

function inferSchemaFromZod(zodSchema: any): any {
    // Unwrap common wrappers (coerce, optional, nullable, effects)
    let schema = zodSchema;
    // unwrap effects
    while (schema?._def?.type === 'effects' && schema?._def?.schema) {
        schema = schema._def.schema;
    }
    // unwrap coerce
    while (schema?._def?.schema) {
        schema = schema._def.schema;
    }
    // unwrap optional/nullable to infer inner type
    if (schema?._def?.innerType) {
        schema = schema._def.innerType;
    }

    const def = schema._def;
    if (!def) return { type: 'object' };

    // Zod v4 uses def.type and object properties directly
    const schemaType = def.type || schema.type;

    // Check if it's an object (has shape property)
    if (def.shape) {
        const properties: Record<string, any> = {};
        const required: string[] = [];
        const shape = def.shape;

        for (const [key, value] of Object.entries(shape as Record<string, any>)) {
            properties[key] = inferSchemaFromZod(value);
            // In Zod v4, check optional status
            const fieldDef = (value as any)._def;
            if (!fieldDef?.optional && fieldDef?.type !== 'optional') {
                required.push(key);
            }
        }

        return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) };
    }

    // Check if it's an array (has element property)
    if (def.element) {
        return { type: 'array', items: inferSchemaFromZod(def.element) };
    }

    // Handle string type
    if (schemaType === 'string') {
        const result: any = { type: 'string' };
        const checks: any[] = Array.isArray((def as any).checks) ? (def as any).checks : [];
        for (const c of checks) {
            if (c.kind === 'email') result.format = 'email';
            if (c.kind === 'uuid') result.format = 'uuid';
            if (c.kind === 'url') result.format = 'uri';
            if (c.kind === 'min') result.minLength = c.value;
            if (c.kind === 'max') result.maxLength = c.value;
        }
        return result;
    }

    // Handle number type
    if (schemaType === 'number') {
        let isInteger = false;
        const result: any = { type: 'number' };
        const checks: any[] = Array.isArray((def as any).checks) ? (def as any).checks : [];
        for (const c of checks) {
            if (c.kind === 'int') isInteger = true;
            if (c.kind === 'min') result.minimum = c.value;
            if (c.kind === 'max') result.maximum = c.value;
        }
        if (isInteger) result.type = 'integer';
        return result;
    }

    // Handle boolean
    if (schemaType === 'boolean') return { type: 'boolean' };

    // Handle enum
    if ((def as any).values && Array.isArray((def as any).values)) return { type: 'string', enum: (def as any).values };

    // Fallback
    if (typeof schemaType === 'string') return { type: schemaType };
    return { type: 'string' };
}

function getResponseDescription(statusCode: string): string {
    const descriptions: Record<string, string> = {
        '200': 'Successful response', '201': 'Resource created', '204': 'No content',
        '400': 'Bad request', '401': 'Unauthorized', '403': 'Forbidden',
        '404': 'Not found', '429': 'Too many requests', '500': 'Internal server error',
        '502': 'Bad gateway', '503': 'Service unavailable',
    };
    return descriptions[statusCode] || `Response ${statusCode}`;
}

generateOpenAPISpec();
