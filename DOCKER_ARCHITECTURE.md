# Docker Architecture

This project uses a multi-stage Docker build approach to optimize image size, build time, and layer reuse.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Dockerfile.base                 │
│  (Contains entire project + builds)     │
│                                         │
│  Stages:                                │
│  1. dependencies - Install deps         │
│  2. builder - Build all projects        │
│  3. production-base - Prod deps + dist  │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴─────────┐
         │                  │
         ▼                  ▼
┌────────────────┐  ┌─────────────────┐
│ Dockerfile.    │  │ Dockerfile.     │
│   backend      │  │   frontend      │
│                │  │                 │
│ - User setup   │  │ - User setup    │
│ - Health check │  │ - Health check  │
│ - CMD: backend │  │ - CMD: frontend │
└────────────────┘  └─────────────────┘
```

## Build Process

### Base Image (`Dockerfile.base`)

The base image contains:
- All source code
- All dependencies (production only in final stage)
- Built artifacts for:
  - `libs/contracts` (shared library)
  - `apps/backend` (NestJS API)
  - `apps/frontend` (Next.js app with standalone mode)
- Runtime configuration files
- Public assets

**Target**: `production-base`

### Backend Image (`Dockerfile.backend`)

Extends the base image and adds:
- Non-root user (nestjs:1001)
- Health check endpoint at `/health`
- Exposes port 3000
- Entrypoint: `node dist/apps/backend/main.js`

### Frontend Image (`Dockerfile.frontend`)

Extends the base image and adds:
- Non-root user (nextjs:1001)
- Next.js standalone server setup
- Health check endpoint at `/`
- Exposes port 3000
- Environment variables for Next.js
- Entrypoint: `node apps/frontend/server.js`

## GitHub Actions Workflow

The CI/CD pipeline builds images in this order:

1. **Install Dependencies**: Install all npm packages with yarn
2. **Build Base Image**:
   - Builds contracts, backend, and frontend inside Docker
   - Pushes to Docker Hub with tags: `latest`, `{commit-sha}`, `{git-tag}`
   - Cached using GitHub Actions cache
3. **Build Backend Image**:
   - Uses the base image as ARG `BASE_IMAGE`
   - Adds backend-specific configuration
   - Pushes with same tagging strategy
4. **Build Frontend Image**:
   - Uses the base image as ARG `BASE_IMAGE`
   - Adds frontend-specific configuration
   - Pushes with same tagging strategy

## Benefits

### 1. **Layer Reuse**
- Both backend and frontend share the same base layers
- Reduces total image size in registry
- Faster pulls when both services are deployed

### 2. **Consistent Builds**
- All projects built in same environment
- Ensures compatibility between contracts, backend, and frontend
- Single source of truth for dependencies

### 3. **Faster CI/CD**
- Build process is cached at multiple stages
- Backend and frontend builds are independent after base
- Can parallelize final image builds if needed

### 4. **Simplified Maintenance**
- Update dependencies in one place (base image)
- Consistent Node.js version across all services
- Single Dockerfile for build logic

### 5. **Flexibility**
- Easy to add more services by extending base image
- Can override base image with local builds for testing
- Support for multi-architecture (amd64, arm64)

## Local Development

### Build all images locally:

```bash
# Build base image
docker build -f Dockerfile.base -t xenforo-media-crawler-base:local .

# Build backend image
docker build -f Dockerfile.backend \
  --build-arg BASE_IMAGE=xenforo-media-crawler-base:local \
  -t xenforo-media-crawler-backend:local .

# Build frontend image
docker build -f Dockerfile.frontend \
  --build-arg BASE_IMAGE=xenforo-media-crawler-base:local \
  -t xenforo-media-crawler-frontend:local .
```

### Or use docker-compose (if available):

```bash
docker-compose build
```

## Production Deployment

Images are available on Docker Hub:

```yaml
services:
  backend:
    image: {DOCKER_USERNAME}/xenforo-media-crawler-backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=...

  frontend:
    image: {DOCKER_USERNAME}/xenforo-media-crawler-frontend:latest
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_URL=http://backend:3000
```

## Image Tags

Each image is tagged with:
- `latest`: Most recent build from main branch
- `{commit-sha}`: Specific commit (e.g., `abc1234`)
- `{git-tag}`: Git tag (e.g., `v1.0.0`)

For production deployments, use specific tags instead of `latest`:

```yaml
image: {DOCKER_USERNAME}/xenforo-media-crawler-backend:v1.0.0
```

## Troubleshooting

### Base image not found when building backend/frontend

Ensure the base image is built and available:

```bash
docker images | grep xenforo-media-crawler-base
```

If missing, build it first:

```bash
docker build -f Dockerfile.base -t xenforo-media-crawler-base:local .
```

### Build fails at dependency installation

Clear Docker build cache:

```bash
docker builder prune
```

Then rebuild from scratch.

### Health checks failing

Check application logs:

```bash
# Backend
docker logs <backend-container-id>

# Frontend
docker logs <frontend-container-id>
```

Ensure required environment variables are set.
