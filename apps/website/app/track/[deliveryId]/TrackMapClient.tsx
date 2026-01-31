"use client";

import L from "leaflet";
import { MapPin } from "lucide-react";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

// Use CDN URLs so the marker icon works regardless of Next.js asset resolution
const LEAFLET_CDN = "https://unpkg.com/leaflet@1.9.4/dist/images";
const defaultMarkerIcon = L.icon({
  iconUrl: `${LEAFLET_CDN}/marker-icon.png`,
  iconRetinaUrl: `${LEAFLET_CDN}/marker-icon-2x.png`,
  shadowUrl: `${LEAFLET_CDN}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface TrackMapDelivery {
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
}

interface TrackMapClientProps {
  center: [number, number];
  delivery: TrackMapDelivery;
  hasPosition: boolean;
}

/** Ensures Leaflet recalculates size after container is mounted (fixes blank map in flex/dynamic layouts) */
function MapSizeFix() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function TrackMapClient({
  center,
  delivery,
  hasPosition,
}: TrackMapClientProps) {
  return (
    <div className="h-full min-h-[400px] w-full" style={{ minHeight: 400 }}>
      <MapContainer
        center={center}
        zoom={hasPosition ? 15 : 10}
        style={{ height: "100%", minHeight: 400, width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapSizeFix />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPosition &&
          delivery.latitude != null &&
          delivery.longitude != null && (
            <Marker
              icon={defaultMarkerIcon}
              position={[delivery.latitude, delivery.longitude]}
            >
              <Popup>
                <div className="text-center">
                  <MapPin className="mx-auto h-5 w-5 text-blue-500" />
                  <p className="mt-1 text-sm font-medium">Position actuelle</p>
                  <p className="text-xs text-gray-500">
                    {new Date(delivery.updated_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
      </MapContainer>
    </div>
  );
}
