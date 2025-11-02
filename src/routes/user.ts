import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getUserWithPosts } from '../services/user-service';
import z from 'zod';
import { userResponseSchema, userIdParamSchema } from '../schemas/user-schema';
import { formatZodError } from '../utils';
import { ErrorCode, ErrorResponse } from '../types';


export default async function userRoute(fastify: FastifyInstance) {

  const paramsSchema = userIdParamSchema;

  fastify.get<{
    Params: z.infer<typeof paramsSchema>;
    Reply: {
      200: z.infer<typeof userResponseSchema>;
      400: ErrorResponse & { code: ErrorCode.INVALID_PARAMETER };
      500: ErrorResponse & { code: ErrorCode.INTERNAL_ERROR };
      502: ErrorResponse & { code: ErrorCode.UPSTREAM_INVALID_RESPONSE };
    };
  }>('/user/:userId', async (request, reply) => {

    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      fastify.log.error({ userId: request.params.userId, error: parsedParams.error }, 'Failed to validate User ID parameter');

      return reply.status(400).send({
        code: ErrorCode.INVALID_PARAMETER,
        message: 'Invalid User ID parameter',
        details: formatZodError(parsedParams.error)
      });
    }

    const { userId } = parsedParams.data;
    const cacheKey = `user:${userId}`;

    try {
      const data = await fastify.swr(cacheKey, async () => {
        const result = await getUserWithPosts(userId, fastify.config.JSON_PLACEHOLDER_API_URL);
        return userResponseSchema.safeParse(result);  // validate before caching
      });

      if (!data.success) {
        fastify.log.error({ userId, cacheKey, error: data.error }, 'Failed to validate user data');

        return reply.status(502).send({
          code: ErrorCode.UPSTREAM_INVALID_RESPONSE,
          message: 'Failed to validate user data',
          details: formatZodError(data.error)
        });
      }

      return reply.status(200).send(data.data);
    } catch (error: unknown) {
      fastify.log.error({ userId, cacheKey, error }, 'Failed to fetch user data');

      return reply.status(500).send({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to fetch user data'
      });
    }
  });
}
