import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import helmetPlugin from '../helmet';

describe('helmet plugin', () => {
  it('sets common security headers', async () => {
    const app = Fastify();
    await app.register(helmetPlugin);
    app.get('/hello', async () => ({ ok: true }));

    const res = await app.inject({ method: 'GET', url: '/hello' });

    expect(res.statusCode).toBe(200);
    // Check a couple of headers helmet typically sets
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();

    await app.close();
  });
});
