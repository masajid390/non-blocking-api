import Fastify, { FastifyInstance } from 'fastify';
import userRoute from '../user';
import swrCachePlugin from '../../plugins/swr-cache';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock data matching the actual schema
const mockUser = {
    id: 1,
    name: 'Leanne Graham',
    username: 'Bret',
    email: 'Sincere@april.biz',
    address: {
        street: 'Kulas Light',
        suite: 'Apt. 556',
        city: 'Gwenborough',
        zipcode: '92998-3874',
    },
    phone: '1-770-736-8031 x56442',
    website: 'hildegard.org',
    company: {
        name: 'Romaguera-Crona',
        catchPhrase: 'Multi-layered client-server neural-net',
        bs: 'harness real-time e-markets',
    },
};

const mockPosts = [
    {
        userId: 1,
        id: 1,
        title: 'sunt aut facere repellat',
        body: 'quia et suscipit suscipit recusandae',
    },
];

// We will mock the service that the route uses so tests don't perform network I/O.
vi.mock('../../services/user-service', () => ({
    getUserWithPosts: vi.fn(),
}));

import { getUserWithPosts } from '../../services/user-service';
import { ErrorCode } from '../../types';
const mockedGetUserWithPosts = vi.mocked(getUserWithPosts);

describe('GET /api/user/:userId', () => {
    let server: FastifyInstance;

    beforeEach(async () => {
        server = Fastify();
        // provide a minimal `config` object like fastify-env would
        server.config = { PORT: '3000', JSON_PLACEHOLDER_API_URL: undefined };
        // register SWR cache plugin so fastify.swr is available to the route
        await server.register(swrCachePlugin);
        await server.register(userRoute, { prefix: '/api' });
    });

    afterEach(async () => {
        await server.close();
        vi.clearAllMocks();
    });

    it('returns 200 and user data for a valid numeric userId', async () => {
        const mockData = { user: mockUser, posts: mockPosts };
        mockedGetUserWithPosts.mockResolvedValueOnce(mockData);

        const res = await server.inject({ method: 'GET', url: '/api/user/1' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toEqual(mockData);
    });

    it('coerces numeric string to number and returns 200', async () => {
        const mockData = {
            user: { ...mockUser, id: 2 },
            posts: mockPosts.map(p => ({ ...p, userId: 2 }))
        };
        mockedGetUserWithPosts.mockResolvedValueOnce(mockData);

        const res = await server.inject({ method: 'GET', url: '/api/user/02' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toEqual(mockData);
        // Verify the service was called with number type and no baseUrl (test env)
        expect(mockedGetUserWithPosts).toHaveBeenCalledWith(2, undefined);
    });

    it('returns 400 for non-numeric userId', async () => {
        const res = await server.inject({ method: 'GET', url: '/api/user/abc' });
        expect(res.statusCode).toBe(400);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('code', ErrorCode.INVALID_PARAMETER);
        expect(body).toHaveProperty('details');
    });

    it('returns 400 for negative userId', async () => {
        const res = await server.inject({ method: 'GET', url: '/api/user/-5' });
        expect(res.statusCode).toBe(400);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('code', ErrorCode.INVALID_PARAMETER);
        expect(body).toHaveProperty('details');
    });

    it('returns 400 for zero userId', async () => {
        const res = await server.inject({ method: 'GET', url: '/api/user/0' });
        expect(res.statusCode).toBe(400);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('code', ErrorCode.INVALID_PARAMETER);
        expect(body).toHaveProperty('details');
    });

    it('returns 400 when path is missing userId param', async () => {
        const res = await server.inject({ method: 'GET', url: '/api/user/' });
        expect(400).toBe(res.statusCode);
    });

    it('returns 500 when the service throws', async () => {
        mockedGetUserWithPosts.mockRejectedValueOnce(new Error('fetch failed'));

        const res = await server.inject({ method: 'GET', url: '/api/user/5' });
        expect(res.statusCode).toBe(500);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('code', ErrorCode.INTERNAL_ERROR);
    });

    it('returns 502 when response fails schema validation', async () => {
        const invalidData = { user: { id: 1 }, posts: [] }; // Missing required fields
        mockedGetUserWithPosts.mockResolvedValueOnce(invalidData);

        const res = await server.inject({ method: 'GET', url: '/api/user/1' });
        expect(res.statusCode).toBe(502);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('code', ErrorCode.UPSTREAM_INVALID_RESPONSE);
        expect(body).toHaveProperty('details');
    });
});
