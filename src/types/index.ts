import { FastifyInstance } from "fastify";

export type FastifyInstanceWithConfig = FastifyInstance & {
    config: {
        PORT: string;
        JSON_PLACEHOLDER_API_URL: string;
    }
}