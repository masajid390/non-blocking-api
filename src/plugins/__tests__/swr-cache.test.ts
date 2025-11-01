import Fastify, { FastifyInstance } from 'fastify';
import swrCachePlugin from '../../plugins/swr-cache';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('swr-cache plugin', () => {
    let fastify: FastifyInstance;

    beforeEach(async () => {
        fastify = Fastify();
        await fastify.register(swrCachePlugin);
    });

    afterEach(async () => {
        await fastify.close();
        vi.clearAllMocks();
    });

    it('fetches on cache miss and caches the result', async () => {
        const fetcher = vi.fn().mockImplementation(() => Promise.resolve({ value: 1 }));

        const res = await fastify.swr('key1', fetcher);
        expect(res).toEqual({ value: 1 });
        expect(fetcher).toHaveBeenCalledTimes(1);

        // subsequent call should return cached value immediately and trigger background refresh
        fetcher.mockImplementation(() => Promise.resolve({ value: 2 }));
        const res2 = await fastify.swr('key1', fetcher);
        expect(res2).toEqual({ value: 1 });
        // background fetch should have been started
        expect(fetcher).toHaveBeenCalledTimes(2);

        // now cached value should be the updated one
        const res3 = await fastify.swr('key1', fetcher);
        expect(res3).toEqual({ value: 2 });
    });
});
