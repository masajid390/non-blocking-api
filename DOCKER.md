# Docker Guide

This guide explains how to build and run the Non-Blocking API using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier setup)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Using Docker CLI

```bash
# Build the image
docker build -t non-blocking-api:latest .

# Run the container
docker run -d \
  --name non-blocking-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e JSON_PLACEHOLDER_API_URL=https://jsonplaceholder.typicode.com \
  non-blocking-api:latest

# View logs
docker logs -f non-blocking-api

# Stop the container
docker stop non-blocking-api

# Remove the container
docker rm non-blocking-api
```

## Environment Variables

The application requires the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Server port | `3000` |
| `JSON_PLACEHOLDER_API_URL` | External API URL | `https://jsonplaceholder.typicode.com` |

You can provide these via:
- `.env` file (mounted as volume)
- Docker run `-e` flags
- Docker Compose environment section

### Using .env file

```bash
docker run -d \
  --name non-blocking-api \
  -p 3000:3000 \
  --env-file .env \
  non-blocking-api:latest
```

## Accessing the Application

Once running, access:
- **Home Page**: http://localhost:3000/
- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics
- **API Endpoint**: http://localhost:3000/api/user/1

## Health Check

The container includes a built-in health check that runs every 30 seconds:

```bash
# Check container health
docker ps

# View health status
docker inspect non-blocking-api --format='{{.State.Health.Status}}'
```

## Multi-Stage Build

The Dockerfile uses a multi-stage build for optimization:

1. **Builder Stage**: Installs all dependencies and compiles TypeScript
2. **Production Stage**: Only includes production dependencies and built files

Benefits:
- Smaller final image size
- No dev dependencies in production
- Faster deployments

## Image Size

The final production image is optimized:
- Base: `node:20-alpine` (~180MB)
- Final image: ~250MB (with dependencies)

## Development vs Production

For development, use:
```bash
pnpm dev
```

For production with Docker:
```bash
docker-compose up
```

## Security Features

- Non-root user (`nodejs`) for running the application
- Minimal Alpine Linux base image
- Only production dependencies included
- Health checks enabled
- Security headers via Helmet plugin

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs non-blocking-api

# Check if port is already in use
lsof -i :3000
```

### Build fails
```bash
# Clean build with no cache
docker build --no-cache -t non-blocking-api:latest .
```

### Permission issues
The container runs as non-root user (nodejs:1001). Ensure volumes have correct permissions.

## Production Deployment

For production deployment, consider:

1. **Use Docker Compose with volumes for logs**:
```yaml
services:
  api:
    volumes:
      - ./logs:/app/logs
```

2. **Add reverse proxy (nginx)**:
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - api
```

3. **Resource limits**:
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

4. **Use secrets for sensitive data**:
```yaml
services:
  api:
    secrets:
      - api_key
secrets:
  api_key:
    external: true
```

## Commands Reference

```bash
# Build
docker build -t non-blocking-api:latest .

# Run
docker run -d --name non-blocking-api -p 3000:3000 non-blocking-api:latest

# Start/Stop
docker start non-blocking-api
docker stop non-blocking-api

# Logs
docker logs -f non-blocking-api

# Shell access
docker exec -it non-blocking-api sh

# Remove
docker rm -f non-blocking-api

# Remove image
docker rmi non-blocking-api:latest
```
