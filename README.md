# non-blocking-api

A production-ready Fastify + TypeScript API with comprehensive security, caching, monitoring, and resilience features. Built with best practices for performance and observability.

## Features

### Core Stack
- **Fastify v5** - High-performance web framework
- **TypeScript** - Type-safe development
- **Zod** - Runtime validation for requests and responses
- **Vitest** - Fast unit testing

### Production Plugins
- **Security (@fastify/helmet)** - Security headers with environment-aware CSP
- **Compression (@fastify/compress)** - Gzip/Brotli/Deflate with 1KB threshold
- **Rate Limiting (@fastify/rate-limit)** - 300 req/min per IP protection
- **Metrics (fastify-metrics)** - Prometheus-compatible metrics endpoint

### Performance Features
- **SWR Cache** - Stale-while-revalidate caching
- **Retry Logic** - Automatic retries with exponential backoff
- **Request Timeout** - 5s default timeout with AbortController
- **Concurrent Fetching** - Parallel API calls with Promise.all

### Observability
- **Structured Logging** - Pino with pretty output in development
- **Prometheus Metrics** - `/metrics` endpoint for monitoring
- **Health Check** - `/health` endpoint for readiness probes

## Requirements

- Node: v25.1.0 (see `.nvmrc`)
- pnpm (preferred package manager)

If you use nvm, switch to the project Node version with:

```bash
nvm use
```

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file (see `.env.example`):

```bash
cp .env.example .env
```

Required variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `JSON_PLACEHOLDER_API_URL` - External API base URL

### 3. Development

```bash
# Start dev server with hot-reload
pnpm dev
```

### 4. Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once (CI)
pnpm test:ci
```

### 5. Production Build

```bash
pnpm build
pnpm start:prod
```

## API Endpoints

### GET /health
Health check endpoint for readiness probes.

```bash
curl http://localhost:3000/health
# Response: { "status": "ok" }
```

### GET /metrics
Prometheus-compatible metrics endpoint.

```bash
curl http://localhost:3000/metrics
```

Provides:
- HTTP request duration histograms
- Request counts by route and status code
- Process metrics (memory, CPU)

### GET /api/user/:userId
Fetch user profile with posts from JSONPlaceholder API.

```bash
curl http://localhost:3000/api/user/1
```

Features:
- Zod validation on params and response
- SWR caching (5-minute TTL)
- Automatic retries (3 attempts, 500ms delay)
- Background cache refresh

Response (200):
```json
{
  "user": { "id": 1, "name": "...", ... },
  "posts": [{ "id": 1, "title": "...", ... }]
}
```

Error responses:
- `400` - Invalid userId parameter
- `500` - Service failure or validation error

## Project Structure

```
src/
├── server.ts              # Main server entry point
├── routes/
│   ├── user.ts           # User API route with caching
│   └── __tests__/        # Route tests
├── services/
│   └── user-service.ts   # Business logic with retry
├── plugins/
│   ├── compress.ts       # Compression plugin
│   ├── helmet.ts         # Security headers
│   ├── rate-limit.ts     # Rate limiting
│   ├── metrics.ts        # Prometheus metrics
│   ├── swr-cache.ts      # SWR cache plugin
│   └── __tests__/        # Plugin tests
├── schemas/
│   └── user-schema.ts    # Zod schemas
├── utils/
│   └── index.ts          # Utilities (fetchJson, retry, etc.)
└── types/
    └── fastify.d.ts      # TypeScript augmentations
```

## Environment Modes

### Development (default)
- Hot-reload with `tsx watch`
- Pretty logs via `pino-pretty`
- CSP disabled for dev tools
- Detailed error messages

### Production
```bash
NODE_ENV=production pnpm dev:prod
```

- CSP enabled with strict directives
- Optimized compression
- Production-grade security headers
- Minimal logging

## Plugin Configuration

### Helmet (Security)
- **Development**: CSP disabled
- **Production**: Strict CSP with `default-src 'self'`
- Always sets: X-Frame-Options, X-DNS-Prefetch-Control, etc.

### Compress
- **Encodings**: gzip, deflate, brotli
- **Threshold**: 1KB (responses < 1KB not compressed)

### Rate Limit
- **Max**: 300 requests per minute per IP
- **Window**: 1 minute rolling
- **Bypass**: `X-Internal: true` header

### SWR Cache
- **Default TTL**: 5 minutes (300s)
- **Cleanup**: Every 60 seconds
- **Custom TTL**: Per-request override via options
- **Behavior**: Returns stale data immediately, refreshes in background

## Testing

Test suite includes:
- ✅ Route validation (params, responses, errors)
- ✅ Plugin behavior (compression, rate limiting, helmet)
- ✅ SWR cache (hits, misses, TTL expiry)
- ✅ Retry logic and timeout handling
- ✅ Error formatting and edge cases

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/routes/__tests__/user.test.ts
```

## Troubleshooting

### Port in use (EADDRINUSE)
Another process is using the configured port:
```bash
# Find process
lsof -i :3000

# Change port in .env
echo "PORT=3001" >> .env
```

### Metrics not appearing in Grafana
1. Check Prometheus is scraping: http://localhost:9090/targets
2. Verify API is reachable from Docker: `host.docker.internal:3000`
3. Restart containers: `docker-compose restart`

### Tests failing
```bash
# Clear cache and re-run
pnpm test --run --reporter=verbose
```

### CSP blocking requests
Set `NODE_ENV=development` to disable CSP, or adjust directives in `src/plugins/helmet.ts`.

## License

MIT
