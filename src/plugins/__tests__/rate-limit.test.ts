import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import rateLimitPlugin from '../rate-limit';

describe('rate-limit plugin', () => {
    it('returns 429 when limit exceeded', async () => {
        const app = Fastify();
        await app.register(rateLimitPlugin, { max: 2, timeWindow: '500 ms' });

        app.get('/ping', async () => ({ ok: true }));

        const res1 = await app.inject({ method: 'GET', url: '/ping' });
        const res2 = await app.inject({ method: 'GET', url: '/ping' });
        const res3 = await app.inject({ method: 'GET', url: '/ping' });

        expect(res1.statusCode).toBe(200);
        expect(res2.statusCode).toBe(200);
        expect(res3.statusCode).toBe(429);
        // should include at least one ratelimit header
        expect(
            res3.headers['x-ratelimit-limit'] ||
            res3.headers['ratelimit-limit'] ||
            res3.headers['retry-after']
        ).toBeTruthy();

        await app.close();
    });
});
