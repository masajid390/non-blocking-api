import { FastifyInstance } from "fastify";

export type FastifyInstanceWithConfig = FastifyInstance & {
    config: {
        PORT: string;
        JSON_PLACEHOLDER_API_URL: string;
    },
    swr: <T>(key: string, fetcher: () => Promise<T>) => Promise<T>;
}