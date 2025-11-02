import { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load HTML at module load time (cached)
const homeHtml = readFileSync(join(__dirname, '../views/home.html'), 'utf-8');

export default async function homeRoute(fastify: FastifyInstance) {
    fastify.get('/', async (req, reply) => {
        reply.type('text/html');
        return homeHtml;
    });
}
