# OSRM Docker Setup

## Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- ~2GB disk space for processed map data

## Initial Setup (Run Once)

### 1. Create data directory and download Washington State map
```bash
mkdir -p data && cd data
wget https://download.geofabrik.de/north-america/us/washington-latest.osm.pbf
```

### 2. Extract the map data (5-15 minutes, ~2GB RAM)
```bash
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/washington-latest.osm.pbf
```

### 3. Partition the data
```bash
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-partition /data/washington-latest.osrm
```

### 4. Customize the data
```bash
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-customize /data/washington-latest.osrm
```

## Starting the Service

```bash
docker-compose up -d
```

## Testing

Test a route from Seattle to Bellevue:
```bash
curl "http://localhost:5000/route/v1/driving/-122.3321,47.6062;-122.2006,47.6101?overview=full&geometries=geojson"
```

Test excluding tolls:
```bash
curl "http://localhost:5000/route/v1/driving/-122.3321,47.6062;-122.2006,47.6101?overview=full&geometries=geojson&exclude=toll"
```

## Stopping the Service

```bash
docker-compose down
```
