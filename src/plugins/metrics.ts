import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyMetrics from 'fastify-metrics';

const metricsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyMetrics, {
        endpoint: '/metrics',
        defaultMetrics: { enabled: true },
        routeMetrics: { enabled: true },
    });

    fastify.log.info('metrics plugin registered');
};

// Wrap with fastify-plugin so it's available globally
export default fp(metricsPlugin, { name: 'metrics' });
