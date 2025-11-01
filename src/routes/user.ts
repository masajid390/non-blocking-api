import { FastifyInstance } from 'fastify';
import { getUserWithPosts } from '../services/user';
import z from 'zod';
import { userResponseSchema } from '../schemas/user-schema';
import { formatZodError } from '../utils';

export default async function userRoute(fastify: FastifyInstance) {

  const paramsSchema = z.object({
    userId: z.number(),
  });

  fastify.get<{ Params: { userId: number } }>('/user/:userId', async (request, reply) => {

    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: 'Invalid query parameter',
        details: formatZodError(parsedParams.error)
      });
    }

    const { userId } = parsedParams.data;

    try {
      const result = await getUserWithPosts(userId);
      const data = userResponseSchema.safeParse(result);

      if (!data.success) {
        return reply.status(500).send({ error: 'Failed to validate user data', details: formatZodError(data.error) });
      }

      return reply.send(data.data);
    } catch (error: unknown) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch user data' });
    }
  });
}
