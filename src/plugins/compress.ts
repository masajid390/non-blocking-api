import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import compress from '@fastify/compress';

// Wrap @fastify/compress as a reusable plugin for our app
const compressPlugin: FastifyPluginAsync = async (fastify) => {
    await fastify.register(compress, {
        // Enable common encodings; brotli will be used when clients support it
        encodings: ['gzip', 'deflate', 'br'],
        threshold: 1024, // only compress responses larger than 1 KB
    });
    fastify.log.info('compress plugin registered');
};

export default fp(compressPlugin, { name: 'compress' });
