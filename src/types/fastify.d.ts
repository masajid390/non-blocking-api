import 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        /** populated by @fastify/env */
        config: {
            PORT: string;
            JSON_PLACEHOLDER_API_URL: string | undefined;
        };

        /** swr-cache plugin decoration */
        swr<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
    }
}
