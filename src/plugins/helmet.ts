import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

// Wrap @fastify/helmet as an app plugin with safe defaults
const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(helmet, {
    // Disable CSP by default to avoid blocking dev assets; you can enable in prod via env later
    contentSecurityPolicy: false,
  });
  fastify.log.info('helmet plugin registered');
};

export default fp(helmetPlugin, { name: 'helmet' });
