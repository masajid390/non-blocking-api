import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import userRoute from './routes/user';
import { FastifyInstanceWithConfig } from './types';
import { getfastifyEnvOptions } from './utils';

const start = async () => {
  const server: FastifyInstance = Fastify({
    logger: {
      transport: { target: 'pino-pretty' },
      level: 'info',
    },
  });

  // register fastify-env to populate server.config from .env
  await server.register(fastifyEnv, getfastifyEnvOptions());

  // Register routes
  server.register(userRoute, { prefix: '/api' });
  server.get('/health', async () => ({ status: 'ok' }));

  // fastify-env decorates the server with a `config` object. Declare the shape
  // we expect and assert the extended server type so TypeScript knows about it.

  const serverWithConfig = server as unknown as FastifyInstanceWithConfig;
  const port = Number(serverWithConfig.config.PORT) || 3000;


  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
