"use client";

import L from "leaflet";
import { MapPin } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

// Use CDN URLs so the marker icon works regardless of Next.js asset resolution
const LEAFLET_CDN = "https://unpkg.com/leaflet@1.9.4/dist/images";
const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTODB_DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
const CARTODB_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

/** Syncs map view to center/zoom when they change (e.g. realtime position updates). MapContainer only uses center as initial value. */
function MapCenterSync({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const isFirst = useRef(true);
  const [lat, lng] = center;
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    map.flyTo(center, zoom, { duration: 0.5 });
  }, [map, center, lat, lng, zoom]);
  return null;
}

export function TrackMapClient({
  center,
  delivery,
  hasPosition,
}: TrackMapClientProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tileUrl = isDark ? CARTODB_DARK_TILES : OSM_TILES;
  const attribution = isDark ? CARTODB_ATTRIBUTION : OSM_ATTRIBUTION;

  return (
    <div
      className="relative isolate -z-40 h-full min-h-[400px] w-full"
      style={{ minHeight: 400 }}
    >
      <MapContainer
        center={center}
        zoom={hasPosition ? 15 : 10}
        style={{ height: "100%", minHeight: 400, width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapSizeFix />
        <MapCenterSync center={center} zoom={hasPosition ? 15 : 10} />
        <TileLayer attribution={attribution} url={tileUrl} />
        {hasPosition &&
          delivery.latitude != null &&
          delivery.longitude != null && (
            <Marker
              icon={defaultMarkerIcon}
              position={[delivery.latitude, delivery.longitude]}
            >
              <Popup>
                <div className="text-center text-gray-900 dark:text-gray-100">
                  <MapPin className="mx-auto h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <p className="mt-1 text-sm font-medium">Position actuelle</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
