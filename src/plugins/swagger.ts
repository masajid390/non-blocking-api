import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';

// Serves Swagger UI at /docs using the generated openapi/openapi.json
export default fp(async function swaggerPlugin(fastify: FastifyInstance) {
    const specPath = join(process.cwd(), 'openapi', 'openapi.json');

    await fastify.register(swagger, {
        mode: 'static',
        specification: {
            path: specPath,
            baseDir: process.cwd(),
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
        staticCSP: true,
        uiConfig: {
            deepLinking: true,
            docExpansion: 'list',
        },
    });
});
