#!/bin/bash

# OSRM Setup Script for Washington State
# This script downloads map data and sets up OSRM routing engine

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"
DATA_DIR="$DOCKER_DIR/data"
OSM_FILE="$DATA_DIR/washington-latest.osm.pbf"
OSRM_FILE="$DATA_DIR/washington-latest.osrm"
MARKER_FILE="$DATA_DIR/.osrm-setup-complete"
TOLL_DATA_FILE="$PROJECT_DIR/src/data/wa-tolls.json"
TOLL_MAX_AGE_HOURS=24

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if toll data needs refreshing (older than 24 hours)
check_toll_data_freshness() {
    if [ ! -f "$TOLL_DATA_FILE" ]; then
        log_warn "Toll data file not found, will scrape fresh data"
        return 1
    fi

    # Get file modification time in seconds since epoch
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        FILE_MOD_TIME=$(stat -f %m "$TOLL_DATA_FILE")
    else
        # Linux
        FILE_MOD_TIME=$(stat -c %Y "$TOLL_DATA_FILE")
    fi

    CURRENT_TIME=$(date +%s)
    AGE_SECONDS=$((CURRENT_TIME - FILE_MOD_TIME))
    AGE_HOURS=$((AGE_SECONDS / 3600))

    if [ "$AGE_HOURS" -ge "$TOLL_MAX_AGE_HOURS" ]; then
        log_warn "Toll data is ${AGE_HOURS} hours old (max: ${TOLL_MAX_AGE_HOURS}h)"
        return 1
    fi

    log_success "Toll data is fresh (${AGE_HOURS}h old, max: ${TOLL_MAX_AGE_HOURS}h)"
    return 0
}

# Refresh toll data by running the scraper
refresh_toll_data() {
    log_info "Refreshing toll rate data from WSDOT..."

    if ! command -v npx &> /dev/null; then
        log_warn "npx not found, skipping toll data refresh"
        return 1
    fi

    cd "$PROJECT_DIR"
    if npx tsx scripts/scrape-tolls.ts; then
        log_success "Toll data refreshed successfully"
        return 0
    else
        log_warn "Toll data refresh failed, using existing data"
        return 1
    fi
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    log_success "Docker is available"
}

# Check if setup is already complete
check_setup_complete() {
    if [ -f "$MARKER_FILE" ]; then
        log_success "OSRM setup already complete"
        return 0
    fi
    return 1
}

# Create data directory
create_data_dir() {
    if [ ! -d "$DATA_DIR" ]; then
        log_info "Creating data directory..."
        mkdir -p "$DATA_DIR"
    fi
}

# Download OSM data
download_osm_data() {
    if [ -f "$OSM_FILE" ]; then
        log_info "OSM file already exists, skipping download"
        return 0
    fi

    log_info "Downloading Washington State OSM data (~328 MB)..."
    log_info "This may take a few minutes depending on your connection..."

    curl -L --progress-bar \
        "https://download.geofabrik.de/north-america/us/washington-latest.osm.pbf" \
        -o "$OSM_FILE"

    log_success "Download complete"
}

# Run OSRM extraction
run_osrm_extract() {
    if [ -f "$DATA_DIR/washington-latest.osrm.ebg" ]; then
        log_info "OSRM extraction already done, skipping"
        return 0
    fi

    log_info "Extracting OSM data (this takes 5-15 minutes)..."
    log_warn "This requires ~2GB RAM. Close other applications if needed."

    docker run --rm -t \
        -v "$DATA_DIR:/data" \
        ghcr.io/project-osrm/osrm-backend \
        osrm-extract -p /opt/car.lua /data/washington-latest.osm.pbf

    log_success "Extraction complete"
}

# Run OSRM partition
run_osrm_partition() {
    if [ -f "$DATA_DIR/washington-latest.osrm.partition" ]; then
        log_info "OSRM partition already done, skipping"
        return 0
    fi

    log_info "Partitioning graph data..."

    docker run --rm -t \
        -v "$DATA_DIR:/data" \
        ghcr.io/project-osrm/osrm-backend \
        osrm-partition /data/washington-latest.osrm

    log_success "Partition complete"
}

# Run OSRM customize
run_osrm_customize() {
    if [ -f "$DATA_DIR/washington-latest.osrm.cell_metrics" ]; then
        log_info "OSRM customize already done, skipping"
        return 0
    fi

    log_info "Customizing routing data..."

    docker run --rm -t \
        -v "$DATA_DIR:/data" \
        ghcr.io/project-osrm/osrm-backend \
        osrm-customize /data/washington-latest.osrm

    log_success "Customize complete"
}

# Start OSRM container
start_osrm_container() {
    # Check if container is already running
    if docker ps --format '{{.Names}}' | grep -q '^osrm-wa$'; then
        log_info "OSRM container already running"
        return 0
    fi

    # Remove stopped container if exists
    if docker ps -a --format '{{.Names}}' | grep -q '^osrm-wa$'; then
        log_info "Removing stopped OSRM container..."
        docker rm osrm-wa > /dev/null
    fi

    log_info "Starting OSRM routing service on port 5000..."

    docker run -d \
        --name osrm-wa \
        -p 5000:5000 \
        -v "$DATA_DIR:/data" \
        --restart unless-stopped \
        ghcr.io/project-osrm/osrm-backend \
        osrm-routed --algorithm mld /data/washington-latest.osrm

    # Wait for service to be ready
    log_info "Waiting for OSRM to be ready..."
    for i in {1..30}; do
        if curl -s "http://localhost:5000/route/v1/driving/-122.3321,47.6062;-122.2006,47.6101" > /dev/null 2>&1; then
            log_success "OSRM is ready and responding"
            return 0
        fi
        sleep 1
    done

    log_warn "OSRM may still be starting up. Check with: docker logs osrm-wa"
}

# Mark setup as complete
mark_complete() {
    echo "$(date)" > "$MARKER_FILE"
    log_success "Setup marked as complete"
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  OSRM Setup for Time-is-Money Router"
    echo "=========================================="
    echo ""

    # Check and refresh toll data if stale (>24 hours)
    if ! check_toll_data_freshness; then
        refresh_toll_data
    fi

    check_docker

    if check_setup_complete; then
        start_osrm_container
        echo ""
        log_success "OSRM is ready at http://localhost:5000"
        exit 0
    fi

    create_data_dir
    download_osm_data
    run_osrm_extract
    run_osrm_partition
    run_osrm_customize
    mark_complete
    start_osrm_container

    echo ""
    echo "=========================================="
    log_success "OSRM setup complete!"
    echo "=========================================="
    echo ""
    echo "Test with:"
    echo "  curl 'http://localhost:5000/route/v1/driving/-122.3321,47.6062;-122.2006,47.6101'"
    echo ""
}

main "$@"
