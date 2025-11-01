import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import userRoute from './routes/user';
import { FastifyInstanceWithConfig } from './types';

const schema = {
  type: 'object',
  required: ['PORT', 'JSON_PLACEHOLDER_API_URL'],
  properties: {
    PORT: { type: 'string', default: '3000' },
    JSON_PLACEHOLDER_API_URL: { type: 'string' },
  },
};

const options: { confKey: string; schema: object; dotenv: boolean } = {
  confKey: 'config', // optional, default: 'config'
  schema: schema,
  dotenv: true,
};

const start = async () => {
  const server: FastifyInstance = Fastify({
    logger: {
      transport: { target: 'pino-pretty' },
      level: 'info',
    },
  });

  // register fastify-env to populate server.config from .env
  await server.register(fastifyEnv, options);

  // Register routes
  server.register(userRoute, { prefix: '/api' });

  // fastify-env decorates the server with a `config` object. Declare the shape
  // we expect and assert the extended server type so TypeScript knows about it.

  const serverWithConfig = server as unknown as FastifyInstanceWithConfig;
  const port = Number(serverWithConfig.config.PORT) || 3000;

  server.get('/health', async () => ({ status: 'ok' }));

  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
