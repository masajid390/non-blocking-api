import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import compressPlugin from '../compress';

describe('compress plugin', () => {
    it('applies gzip when client supports it and payload > 1KB', async () => {
        const app = Fastify();
        await app.register(compressPlugin);
        app.get('/big', async () => {
            // ensure payload is large enough to be compressed (> 1KB threshold)
            return 'x'.repeat(4096);
        });

        const res = await app.inject({
            method: 'GET',
            url: '/big',
            headers: { 'accept-encoding': 'gzip' },
        });

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-encoding']).toBe('gzip');

        await app.close();
    });

    it('does not compress when payload is less than 1KB threshold', async () => {
        const app = Fastify();
        await app.register(compressPlugin);
        app.get('/small', async () => {
            // small payload below 1KB threshold
            return 'x'.repeat(500);
        });

        const res = await app.inject({
            method: 'GET',
            url: '/small',
            headers: { 'accept-encoding': 'gzip' },
        });

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-encoding']).toBeUndefined();

        await app.close();
    });
});
