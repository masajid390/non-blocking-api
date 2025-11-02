import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import helmetPlugin from '../helmet';
import { getfastifyEnvOptions } from '../../utils';

describe('helmet plugin', () => {
    it('sets common security headers in development', async () => {
        const app = Fastify();
        await app.register(fastifyEnv, getfastifyEnvOptions());
        await app.register(helmetPlugin);
        app.get('/hello', async () => ({ ok: true }));

        const res = await app.inject({ method: 'GET', url: '/hello' });

        expect(res.statusCode).toBe(200);
        expect(res.headers['x-dns-prefetch-control']).toBeDefined();
        expect(res.headers['x-frame-options']).toBeDefined();
        // CSP should be disabled in dev
        expect(res.headers['content-security-policy']).toBeUndefined();

        await app.close();
    });

    it('enables CSP in production mode', async () => {
        const app = Fastify();
        await app.register(fastifyEnv, {
            ...getfastifyEnvOptions(),
            data: { NODE_ENV: 'production', PORT: '3000', JSON_PLACEHOLDER_API_URL: 'https://example.com' },
        });
        await app.register(helmetPlugin);
        app.get('/hello', async () => ({ ok: true }));

        const res = await app.inject({ method: 'GET', url: '/hello' });

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-security-policy']).toBeDefined();
        expect(res.headers['content-security-policy']).toContain("default-src 'self'");

        await app.close();
    });
});
