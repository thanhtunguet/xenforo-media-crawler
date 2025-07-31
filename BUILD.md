# Build Process Documentation

## Overview

This project uses an optimized CI/CD pipeline that separates the build and runtime stages for better efficiency and security.

## Build Process

### 1. CI/CD Pipeline (GitHub Actions)

The build process in `.github/workflows/node.js.yml` follows these steps:

1. **Setup**: Checkout code and setup Node.js 22 with Yarn caching
2. **Install Dependencies**: Install all dependencies (including dev dependencies)
3. **Build Application**: Run `yarn build` to compile TypeScript to JavaScript
4. **Install Production Dependencies**: Reinstall only production dependencies
5. **Cache Artifacts**: Cache the built application and production dependencies
6. **Docker Build**: Use `Dockerfile.ci` to create the final image

### 2. Docker Images

#### For CI/CD (`Dockerfile.ci`)
- Expects pre-built artifacts from GitHub Actions
- Only installs production dependencies
- Optimized for CI pipeline efficiency
- Smaller final image size

#### For Local Development (`Dockerfile`)
- Multi-stage build that handles both build and runtime
- Can be used for local development and testing
- Includes build stage as fallback

## Key Optimizations

### 1. Layer Caching
- Dependencies are installed in separate layers
- Build artifacts are cached between CI runs
- Docker layer caching is enabled for faster builds

### 2. Security
- Non-root user (`nestjs`) runs the application
- Minimal attack surface with production-only dependencies
- Health checks for container monitoring

### 3. Size Optimization
- Alpine Linux base image
- Production-only dependencies in final image
- Yarn cache cleaning to reduce image size

## Usage

### Local Development
```bash
# Build locally
docker build -t xenforo-media-crawler .

# Run locally
docker run -p 3000:3000 xenforo-media-crawler
```

### CI/CD
The pipeline automatically:
- Builds on push to main/master branches
- Builds on tag creation (v*)
- Pushes to Docker Hub with multiple tags:
  - `latest`
  - `{commit-sha}`
  - `{git-tag}` (if applicable)

## Environment Variables

Required secrets for CI/CD:
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password/token

## Health Check

The container includes a health check that:
- Runs every 30 seconds
- Checks the `/health` endpoint
- Times out after 3 seconds
- Retries 3 times before marking unhealthy

## Ports

- **3000**: Application port (HTTP)

## File Structure

```
/app
├── dist/           # Built application (from CI)
├── node_modules/   # Production dependencies
├── src/_config/    # Configuration files
├── views/          # Template files
├── package.json    # Package configuration
└── yarn.lock       # Lock file
``` 