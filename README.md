# non-blocking-api

A minimal Fastify + TypeScript API template. It uses `@fastify/env` to load environment variables, `pino-pretty` for readable logs in development, and a small `/health` endpoint for readiness checks.

## Requirements

- Node: v25.1.0 (see `.nvmrc`)
- pnpm (preferred package manager)

If you use nvm, switch to the project Node version with:

```bash
nvm use
# or explicitly
nvm use v25.1.0
```

The repository includes a `.nvmrc` file that pins Node to `v25.1.0`.

## Quick start

1. Install dependencies

```bash
pnpm install
```

2. Build

```bash
pnpm run build
```

3. Run

```bash
pnpm start
```

By default the app reads `PORT` from a `.env` file (there's a sample `.env` in the repo). The server exposes a health endpoint:

```
GET /health
# -> { "status": "ok" }
```

### Development notes

- Logging: the server uses `pino-pretty` to format logs when the Fastify logger is enabled. In production you might want to remove `pino-pretty` and send raw pino output to a log collector.

- Environment loading: `@fastify/env` is used to validate and populate `server.config` from `.env`. The code validates `PORT` and uses a default of `3000`.

## Files of interest

- `src/server.ts` - main server entry (Fastify instance, `/health` route, env loading)
- `.env` - environment variables (not committed by default)
- `.nvmrc` - node version file (keeps contributors on Node `v25.1.0`)

## .nvmrc description

The `.nvmrc` file pins the Node.js version used for local development. When contributors run `nvm use` in this project directory, nvm will switch the active Node version to the one declared in `.nvmrc` (here `v25.1.0`). This helps ensure consistent behavior between machines and CI.

## Troubleshooting

- If you see `EADDRINUSE` when starting the server, another process is already listening on the configured `PORT`. Stop the other process or change `PORT` in `.env`.

- To view verbose plugin/validation warnings, re-run the server with `node --trace-warnings` (or enable debug logging where appropriate).

## License

MIT
