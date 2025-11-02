import { FastifyInstance } from 'fastify';
import { getUserWithPosts } from '../services/user-service';
import z from 'zod';
import { userResponseSchema } from '../schemas/user-schema';
import { formatZodError } from '../utils';

export default async function userRoute(fastify: FastifyInstance) {

  const paramsSchema = z.object({
    userId: z.coerce.number().positive(),
  });

  fastify.get<{ Params: { userId: string } }>('/user/:userId', async (request, reply) => {

    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      fastify.log.error({ userId: request.params.userId, error: parsedParams.error }, 'Failed to validate User ID parameter');
      return reply.status(400).send({
        error: 'Invalid User ID parameter',
        details: formatZodError(parsedParams.error)
      });
    }

    const { userId } = parsedParams.data;
    const cacheKey = `user:${userId}`

    try {
      const data = await fastify.swr(cacheKey, async () => {
        const result = await getUserWithPosts(userId, fastify.config.JSON_PLACEHOLDER_API_URL);
        return userResponseSchema.safeParse(result);  // validate before caching
      });

      if (!data.success) {
        fastify.log.error({ userId, cacheKey, error: data.error }, 'Failed to validate user data');
        return reply.status(502).send({ error: 'Failed to validate user data', details: formatZodError(data.error) });
      }

      return reply.send(data.data);
    } catch (error: unknown) {
      fastify.log.error({ userId, cacheKey, error }, 'Failed to fetch user data');
      return reply.status(500).send({ error: 'Failed to fetch user data' });
    }
  });
}
