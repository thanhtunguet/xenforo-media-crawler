# Docker Compose Setup

This docker-compose file allows you to run the entire XenForo Media Crawler stack with a single command.

## Prerequisites

- Docker and Docker Compose installed
- (Optional) Docker Hub credentials if using pre-built images

## Quick Start

1. **Create a `.env` file** (optional, for custom configuration):
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop all services**:
   ```bash
   docker-compose down
   ```

## Services

The docker-compose file includes:

- **database**: MySQL 8.0 database
- **backend**: NestJS backend API (port 3000)
- **frontend**: Next.js frontend application (port 3001)

## Configuration

### Environment Variables

You can configure the services using environment variables or a `.env` file:

```bash
# Docker Configuration
DOCKER_USERNAME=thanhtunguet
IMAGE_TAG=latest

# Database Configuration
DB_ROOT_PASSWORD=rootpassword
DB_NAME=xenforo_crawler
DB_USER=xenforo_user
DB_PASSWORD=xenforo_password
DB_PORT=3306
DB_SYNCHRONIZE=false
DB_LOGGING=false

# Service Ports
BACKEND_PORT=3000
FRONTEND_PORT=3001

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# XenForo Configuration (Optional)
XENFORO_URL=
XENFORO_USERNAME=
XENFORO_PASSWORD=
```

### Using Pre-built Images

By default, the compose file uses pre-built images from Docker Hub. To use them:

1. Set `DOCKER_USERNAME` in your `.env` file (or use the default `thanhtunguet`)
2. Ensure the images are available:
   - `{DOCKER_USERNAME}/xenforo-media-crawler-backend:latest`
   - `{DOCKER_USERNAME}/xenforo-media-crawler-frontend:latest`

### Building Locally

If you want to build images locally instead of pulling from Docker Hub, you can use:

```bash
docker-compose build
docker-compose up -d
```

Or build and run in one command:

```bash
docker-compose up -d --build
```

## Accessing the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/api
- **Database**: localhost:3306 (if exposed)

## Volumes

The following volumes are created:

- `mysql_data`: Persistent storage for MySQL database
- `./downloads`: Local directory for downloaded media (mounted to backend)
- `./cookies.json`: Cookie file for authentication (mounted to backend)

## Health Checks

All services include health checks:
- Database: MySQL ping
- Backend: HTTP health endpoint
- Frontend: HTTP root endpoint

Services wait for dependencies to be healthy before starting.

## Troubleshooting

### View service logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Restart a service:
```bash
docker-compose restart backend
```

### Rebuild and restart:
```bash
docker-compose up -d --build --force-recreate
```

### Clean up everything (including volumes):
```bash
docker-compose down -v
```

## Production Considerations

For production deployments:

1. **Change default passwords** in `.env`
2. **Set `DB_SYNCHRONIZE=false`** (already default)
3. **Use proper secrets management** instead of `.env` files
4. **Configure proper CORS** in backend for your domain
5. **Use reverse proxy** (nginx/traefik) for SSL/TLS
6. **Set up database backups**
7. **Use specific image tags** instead of `latest`


