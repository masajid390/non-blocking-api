import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import compressPlugin from '../compress';

describe('compress plugin', () => {
    it('applies gzip when client supports it', async () => {
        const app = Fastify();
        await app.register(compressPlugin);
        app.get('/big', async () => {
            // ensure payload is large enough to be compressed
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
});
