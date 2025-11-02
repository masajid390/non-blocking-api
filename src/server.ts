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

const start = async () => {
  const server: FastifyInstance = Fastify({
    logger: {
      transport: { target: 'pino-pretty' },
      level: 'info',
    },
  });

  // Track shutdown state to signal load balancers via /health
  let isShuttingDown = false;

  // register fastify-env to populate server.config from .env
  await server.register(fastifyEnv, getfastifyEnvOptions());

  // register plugins
  await server.register(metricsPlugin);
  await server.register(helmetPlugin);
  await server.register(compressPlugin);
  await server.register(rateLimitPlugin);
  await server.register(swrCachePlugin);

  // Register routes
  server.register(userRoute, { prefix: '/api' });
  server.get('/health', async (req, reply) => {
    if (isShuttingDown) {
      return reply.code(503).send({ status: 'shutting_down' });
    }
    return { status: 'ok' };
  });

  // fastify-env decorates the server with a `config` object. Declare the shape
  // we expect and assert the extended server type so TypeScript knows about it.

  const port = Number(server.config.PORT) || 3000;


  try {
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

    process.on('SIGTERM', closeGracefully);
    process.on('SIGINT', closeGracefully);

    // Log plugin/server close sequence
    server.addHook('onClose', async (instance) => {
      instance.log.info('Fastify onClose hook executed');
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
