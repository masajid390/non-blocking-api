import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import NodeCache from 'node-cache';
import { FastifyInstanceWithConfig } from '../types';

interface SWRCache {
    /**
     * Returns cached data if available; triggers background refresh automatically.
     * @param key cache key
     * @param fetcher async function that fetches fresh data
     */
    get<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
}

const swrCachePlugin: FastifyPluginAsync = async (fastify: FastifyInstanceWithConfig) => {
    const cache = new NodeCache();

    const swr: SWRCache = {
        async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
            const cached = cache.get<T>(key);
            if (cached) {
                // Background refresh
                fetcher()
                    .then((data) => cache.set(key, data))
                    .catch((err) => fastify.log.error(`SWR revalidation failed: ${err.message}`));
                return cached; // return stale data immediately
            }

            // Cache miss → fetch synchronously
            const data = await fetcher();
            cache.set(key, data);
            return data;
        },
    };

    // Helper method to simplify usage: always returns a function that handles caching internally
    fastify.decorate('swr', <T>(key: string, fetcher: () => Promise<T>) => swr.get(key, fetcher));

    fastify.log.info('swr-cache plugin registered');
};

// Wrap with fastify-plugin so the decoration is visible to other plugins/routes
export default fp(swrCachePlugin, { name: 'swr-cache' });
