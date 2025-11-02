import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

type RateLimitOpts = Parameters<typeof rateLimit>[1];

// Wrap @fastify/rate-limit to centralize defaults and allow overrides per registration
const rateLimitPlugin: FastifyPluginAsync<RateLimitOpts> = async (fastify, opts) => {
  await fastify.register(rateLimit, {
    max: 300, // requests per timeWindow per IP
    timeWindow: '1 minute',
    skipOnError: true, // avoid blocking requests if store/errors occur
    ...opts,
  });
  fastify.log.info('rate-limit plugin registered');
};

export default fp(rateLimitPlugin, { name: 'rate-limit' });
