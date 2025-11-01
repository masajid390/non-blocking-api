import { FastifyInstance } from 'fastify';
import { getUserWithPosts } from '../services/user';

export default async function userRoute(fastify: FastifyInstance) {

    fastify.get<{ Params: { userId: number } }>('/user/:userId', async (request, reply) => {
        const { userId } = request.params;

        if (!userId) {
            return reply.status(400).send({
                error: 'Invalid query parameter',
                details: 'userId is required',
            });
        }

        try {
            const { userId } = request.params;

            return await getUserWithPosts(userId);
        } catch (error: unknown) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch user data' });
        }
    });
}
