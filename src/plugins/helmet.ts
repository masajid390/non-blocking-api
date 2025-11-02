import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

// Wrap @fastify/helmet as an app plugin with environment-aware CSP
const helmetPlugin: FastifyPluginAsync = async (fastify) => {
    const isProduction = fastify.config.NODE_ENV === 'production';

    await fastify.register(helmet, {
        // Enable CSP in production; disable in dev to avoid blocking hot-reload/dev assets
        contentSecurityPolicy: isProduction
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            }
            : false,
    });
    fastify.log.info(`helmet plugin registered (CSP: ${isProduction ? 'enabled' : 'disabled'})`);
};

export default fp(helmetPlugin, { name: 'helmet' });
