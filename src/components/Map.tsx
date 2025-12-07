'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup, ZoomControl } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

interface MapProps {
  center?: LatLngExpression;
  tollRoute?: GeoJSON.LineString | null;
  freeRoute?: GeoJSON.LineString | null;
  recommendation?: 'toll' | 'free' | null;
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
}

export default function Map({
  center = [47.6062, -122.3321], // Seattle
  tollRoute,
  freeRoute,
  recommendation,
  origin,
  destination
}: MapProps) {
  // Convert GeoJSON to Leaflet format (swap lng/lat to lat/lng)
  const toLatLng = (coords: number[][]): LatLngExpression[] => {
    return coords.map(([lng, lat]) => [lat, lng] as LatLngExpression);
  };

  return (
    <MapContainer
      center={center}
      zoom={10}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />

      {/* Free route (gray/dashed when not recommended) */}
      {freeRoute && (
        <Polyline
          positions={toLatLng(freeRoute.coordinates)}
          color={recommendation === 'free' ? '#22c55e' : '#9ca3af'}
          weight={recommendation === 'free' ? 6 : 4}
          dashArray={recommendation === 'free' ? undefined : '10, 10'}
        />
      )}

      {/* Toll route (blue when recommended, gray otherwise) */}
      {tollRoute && (
        <Polyline
          positions={toLatLng(tollRoute.coordinates)}
          color={recommendation === 'toll' ? '#3b82f6' : '#9ca3af'}
          weight={recommendation === 'toll' ? 6 : 4}
          dashArray={recommendation === 'toll' ? undefined : '10, 10'}
        />
      )}

      {/* Origin marker */}
      {origin && (
        <Marker position={[origin.lat, origin.lng]}>
          <Popup>Start</Popup>
        </Marker>
      )}

      {/* Destination marker */}
      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>Destination</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
