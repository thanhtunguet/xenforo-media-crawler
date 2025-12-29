#!/bin/bash

# Local Build Script for XenForo Media Crawler
# This script replicates the GitHub Actions workflow locally
#
# Usage:
#   ./build-local.sh
#
# Environment Variables:
#   DOCKER_USERNAME    - Docker Hub username (optional, required for pushing)
#   DOCKER_PASSWORD    - Docker Hub password (optional, required for pushing)
#   PUSH_IMAGES        - Set to "true" to push images to Docker Hub (default: false)
#   PLATFORMS          - Comma-separated platforms to build (default: linux/amd64,linux/arm64)
#   CLEANUP            - Set to "false" to skip cleanup steps (default: true)
#
# Examples:
#   # Build locally only (no push)
#   ./build-local.sh
#
#   # Build and push to Docker Hub
#   DOCKER_USERNAME=myuser DOCKER_PASSWORD=mypass PUSH_IMAGES=true ./build-local.sh
#
#   # Build for single platform only
#   PLATFORMS=linux/amd64 ./build-local.sh
#
#   # Build without cleanup (faster, uses more disk space)
#   CLEANUP=false ./build-local.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
DOCKER_PASSWORD="${DOCKER_PASSWORD:-}"
PUSH_IMAGES="${PUSH_IMAGES:-false}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
CLEANUP="${CLEANUP:-true}"

# Image names
BASE_IMAGE_NAME="xenforo-media-crawler-base"
BACKEND_IMAGE_NAME="xenforo-media-crawler-backend"
FRONTEND_IMAGE_NAME="xenforo-media-crawler-frontend"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=0
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        missing=1
    else
        local node_version=$(node --version)
        log_success "Node.js found: $node_version"
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        missing=1
    else
        local docker_version=$(docker --version)
        log_success "Docker found: $docker_version"
    fi
    
    if ! command -v yarn &> /dev/null; then
        log_error "Yarn is not installed"
        missing=1
    else
        local yarn_version=$(yarn --version)
        log_success "Yarn found: $yarn_version"
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        missing=1
    else
        log_success "Git found"
    fi
    
    if [ $missing -eq 1 ]; then
        log_error "Please install missing prerequisites"
        exit 1
    fi
}

setup_docker_buildx() {
    log_info "Setting up Docker Buildx..."
    
    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx is not available"
        exit 1
    fi
    
    # Create builder instance if it doesn't exist
    if ! docker buildx ls | grep -q "local-builder"; then
        log_info "Creating Docker Buildx builder instance..."
        docker buildx create --name local-builder --driver docker-container --use || true
        docker buildx inspect --bootstrap || true
    else
        log_info "Using existing Docker Buildx builder instance..."
        docker buildx use local-builder || true
    fi
    
    log_success "Docker Buildx is ready"
}

extract_git_info() {
    log_info "Extracting Git information..."
    
    COMMIT_SHA=$(git rev-parse HEAD)
    log_success "Commit SHA: $COMMIT_SHA"
    
    # Check if we're on a tag
    if git describe --exact-match --tags HEAD &> /dev/null; then
        TAG=$(git describe --exact-match --tags HEAD)
        log_success "Git tag: $TAG"
    else
        TAG="latest"
        log_info "No git tag found, using 'latest'"
    fi
    
    # Determine if we should push (only if DOCKER_USERNAME is set and PUSH_IMAGES is true)
    if [ -n "$DOCKER_USERNAME" ] && [ "$PUSH_IMAGES" = "true" ]; then
        PUSH="true"
        log_info "Images will be pushed to Docker Hub as: $DOCKER_USERNAME/*"
    else
        PUSH="false"
        log_info "Images will be built locally only (not pushed)"
    fi
}

cleanup_docker() {
    if [ "$CLEANUP" = "true" ]; then
        log_info "Cleaning up Docker resources..."
        docker system prune -af --volumes || true
        docker builder prune -af || true
        log_success "Docker cleanup completed"
    fi
}

check_disk_space() {
    log_info "Checking disk space..."
    df -h
    echo ""
    docker system df
}

docker_login() {
    if [ "$PUSH" = "true" ]; then
        if [ -z "$DOCKER_PASSWORD" ]; then
            log_warning "DOCKER_PASSWORD not set, attempting to login with existing credentials..."
            if ! docker login -u "$DOCKER_USERNAME" &> /dev/null; then
                log_error "Docker login failed. Please set DOCKER_PASSWORD or login manually"
                exit 1
            fi
        else
            log_info "Logging into Docker Hub..."
            echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
            log_success "Logged into Docker Hub"
        fi
    fi
}

build_image() {
    local dockerfile=$1
    local image_name=$2
    local build_args=$3
    
    log_info "Building $image_name..."
    
    local tags=()
    if [ "$PUSH" = "true" ]; then
        tags+=("$DOCKER_USERNAME/$image_name:latest")
        tags+=("$DOCKER_USERNAME/$image_name:$COMMIT_SHA")
        tags+=("$DOCKER_USERNAME/$image_name:$TAG")
    else
        tags+=("$image_name:latest")
        tags+=("$image_name:$COMMIT_SHA")
        tags+=("$image_name:$TAG")
    fi
    
    local tag_args=""
    for tag in "${tags[@]}"; do
        tag_args="$tag_args -t $tag"
    done
    
    # Determine platform and load strategy
    local build_platforms="$PLATFORMS"
    local load_flag=""
    
    if [ "$PUSH" = "true" ]; then
        # When pushing, we can build for multiple platforms
        load_flag="--push"
    else
        # When not pushing, --load only works with single platform
        # Check if multiple platforms are specified
        local platform_count=$(echo "$PLATFORMS" | tr ',' '\n' | wc -l | tr -d ' ')
        if [ "$platform_count" -gt 1 ]; then
            log_warning "Multiple platforms specified but not pushing. Building for current platform only."
            # Detect current platform using uname
            local arch=$(uname -m)
            case "$arch" in
                x86_64)
                    build_platforms="linux/amd64"
                    ;;
                aarch64|arm64)
                    build_platforms="linux/arm64"
                    ;;
                *)
                    log_warning "Unknown architecture: $arch, defaulting to linux/amd64"
                    build_platforms="linux/amd64"
                    ;;
            esac
            log_info "Building for platform: $build_platforms (detected from: $arch)"
        fi
        load_flag="--load"
    fi
    
    # Build command
    local build_cmd="docker buildx build"
    build_cmd="$build_cmd --platform $build_platforms"
    build_cmd="$build_cmd --file $dockerfile"
    build_cmd="$build_cmd $tag_args"
    
    if [ -n "$build_args" ]; then
        build_cmd="$build_cmd $build_args"
    fi
    
    build_cmd="$build_cmd $load_flag"
    build_cmd="$build_cmd ."
    
    log_info "Running: $build_cmd"
    eval $build_cmd
    
    log_success "$image_name built successfully"
    
    # Cleanup after build
    if [ "$CLEANUP" = "true" ]; then
        log_info "Cleaning up after $image_name build..."
        docker builder prune -af --filter type=exec.cachemount --filter type=regular || true
    fi
}

show_help() {
    cat << EOF
Local Build Script for XenForo Media Crawler

This script replicates the GitHub Actions workflow locally.

Usage:
    ./build-local.sh [OPTIONS]

Options:
    -h, --help          Show this help message
    -p, --push          Push images to Docker Hub (requires DOCKER_USERNAME and DOCKER_PASSWORD)
    --platforms PLAT    Comma-separated platforms (default: linux/amd64,linux/arm64)
    --no-cleanup        Skip cleanup steps (faster but uses more disk space)

Environment Variables:
    DOCKER_USERNAME     Docker Hub username (required for pushing)
    DOCKER_PASSWORD     Docker Hub password (required for pushing)

Examples:
    # Build locally only (no push)
    ./build-local.sh

    # Build and push to Docker Hub
    DOCKER_USERNAME=myuser DOCKER_PASSWORD=mypass ./build-local.sh --push

    # Build for single platform only
    ./build-local.sh --platforms linux/amd64

    # Build without cleanup
    ./build-local.sh --no-cleanup
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--push)
            PUSH_IMAGES="true"
            shift
            ;;
        --platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        --no-cleanup)
            CLEANUP="false"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting local build workflow..."
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_docker_buildx
    echo ""
    
    cleanup_docker
    echo ""
    
    check_disk_space
    echo ""
    
    extract_git_info
    echo ""
    
    docker_login
    echo ""
    
    log_info "Installing dependencies..."
    yarn install --frozen-lockfile
    log_success "Dependencies installed"
    echo ""
    
    # Build base image
    build_image "Dockerfile.base" "$BASE_IMAGE_NAME" ""
    echo ""
    
    check_disk_space
    echo ""
    
    # Build backend image
    local backend_base_image
    if [ "$PUSH" = "true" ]; then
        backend_base_image="$DOCKER_USERNAME/$BASE_IMAGE_NAME:latest"
    else
        backend_base_image="$BASE_IMAGE_NAME:latest"
    fi
    
    build_image "Dockerfile.backend" "$BACKEND_IMAGE_NAME" "--build-arg BASE_IMAGE=$backend_base_image"
    echo ""
    
    check_disk_space
    echo ""
    
    # Build frontend image
    local frontend_base_image
    if [ "$PUSH" = "true" ]; then
        frontend_base_image="$DOCKER_USERNAME/$BASE_IMAGE_NAME:latest"
    else
        frontend_base_image="$BASE_IMAGE_NAME:latest"
    fi
    
    build_image "Dockerfile.frontend" "$FRONTEND_IMAGE_NAME" "--build-arg BASE_IMAGE=$frontend_base_image"
    echo ""
    
    # Final cleanup
    if [ "$CLEANUP" = "true" ]; then
        cleanup_docker
        check_disk_space
    fi
    
    echo ""
    log_success "Build workflow completed successfully!"
    echo ""
    log_info "Built images:"
    if [ "$PUSH" = "true" ]; then
        echo "  - $DOCKER_USERNAME/$BASE_IMAGE_NAME:latest"
        echo "  - $DOCKER_USERNAME/$BASE_IMAGE_NAME:$COMMIT_SHA"
        echo "  - $DOCKER_USERNAME/$BASE_IMAGE_NAME:$TAG"
        echo "  - $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:latest"
        echo "  - $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$COMMIT_SHA"
        echo "  - $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$TAG"
        echo "  - $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:latest"
        echo "  - $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$COMMIT_SHA"
        echo "  - $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$TAG"
    else
        echo "  - $BASE_IMAGE_NAME:latest"
        echo "  - $BASE_IMAGE_NAME:$COMMIT_SHA"
        echo "  - $BASE_IMAGE_NAME:$TAG"
        echo "  - $BACKEND_IMAGE_NAME:latest"
        echo "  - $BACKEND_IMAGE_NAME:$COMMIT_SHA"
        echo "  - $BACKEND_IMAGE_NAME:$TAG"
        echo "  - $FRONTEND_IMAGE_NAME:latest"
        echo "  - $FRONTEND_IMAGE_NAME:$COMMIT_SHA"
        echo "  - $FRONTEND_IMAGE_NAME:$TAG"
    fi
}

# Run main function
main

