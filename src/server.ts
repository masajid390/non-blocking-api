import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import userRoute from './routes/user';
import { getfastifyEnvOptions } from './utils';
import swrCachePlugin from './plugins/swr-cache';
import metricsPlugin from './plugins/metrics';
import compressPlugin from './plugins/compress';
import rateLimitPlugin from './plugins/rate-limit';
import helmetPlugin from './plugins/helmet';
import swaggerPlugin from './plugins/swagger';

const start = async () => {
  const server: FastifyInstance = Fastify({
    logger: {
      transport: { target: 'pino-pretty' },
      level: 'info',
    },
  });

  // Track shutdown state to signal load balancers via /health
  let isShuttingDown = false;

  try {
    // register fastify-env to populate server.config from .env
    await server.register(fastifyEnv, getfastifyEnvOptions());
    server.log.info('✓ Environment configuration loaded');

    // register plugins
    await server.register(metricsPlugin);
    server.log.info('✓ Metrics plugin registered');

    await server.register(helmetPlugin);
    server.log.info('✓ Helmet security plugin registered');

    await server.register(compressPlugin);
    server.log.info('✓ Compression plugin registered');

    await server.register(rateLimitPlugin);
    server.log.info('✓ Rate limit plugin registered');

    await server.register(swrCachePlugin);
    server.log.info('✓ SWR cache plugin registered');

    // Swagger docs (non-production by default)
    if (server.config.NODE_ENV !== 'production') {
      try {
        await server.register(swaggerPlugin);
        server.log.info('✓ Swagger docs available at /docs');
      } catch (err) {
        server.log.error({ err }, 'Failed to register Swagger docs');
      }
    }

    // Register routes
    server.register(userRoute, { prefix: '/api' });
    server.get('/health', async (req, reply) => {
      if (isShuttingDown) {
        return reply.code(503).send({ status: 'shutting_down' });
      }
      return { status: 'ok' };
    });
    server.log.info('✓ Routes registered');

    // fastify-env decorates the server with a `config` object. Declare the shape
    // we expect and assert the extended server type so TypeScript knows about it.

    const port = Number(server.config.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on ${port}`);

    // Graceful shutdown on SIGINT/SIGTERM
    const closeGracefully = async (signal: NodeJS.Signals) => {
      server.log.info({ signal }, 'Received shutdown signal, closing gracefully...');
      isShuttingDown = true;
      // Force shutdown timer as a safety net
      const forceTimeout = setTimeout(() => {
        server.log.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);

      try {
        await server.close();
        clearTimeout(forceTimeout);
        server.log.info('HTTP server closed. Bye!');
        process.exit(0);
      } catch (err) {
        clearTimeout(forceTimeout);
        server.log.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    // Register signal handlers with error protection
    try {
      process.on('SIGTERM', closeGracefully);
      process.on('SIGINT', closeGracefully);
      server.log.info('Signal handlers registered (SIGTERM, SIGINT)');
    } catch (err) {
      server.log.error({ err }, 'Failed to register signal handlers');
    }

  } catch (err) {
    server.log.error({ err }, 'Fatal error during server startup');
    process.exit(1);
  }
};

start().catch((err) => {
  console.error('Unhandled error in start():', err);
  process.exit(1);
});
