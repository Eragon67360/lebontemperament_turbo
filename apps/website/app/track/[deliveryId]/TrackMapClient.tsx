"use client";

import { MapPin } from "lucide-react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

const OSM_TILES = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];
const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTODB_DARK_TILES = [
  "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
];
const CARTODB_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

function getMapStyle(isDark: boolean) {
  const tiles = isDark ? CARTODB_DARK_TILES : OSM_TILES;
  const attribution = isDark ? CARTODB_ATTRIBUTION : OSM_ATTRIBUTION;
  return {
    version: 8 as const,
    sources: {
      "raster-tiles": {
        type: "raster" as const,
        tiles,
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: "raster-layer",
        type: "raster" as const,
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

const DRIVER_SOURCE_ID = "driver-position";
const DRIVER_LAYER_ID = "driver-marker";
const ROUTE_SOURCE_ID = "route";
const ROUTE_LAYER_ID = "route-line";

export interface TrackMapDelivery {
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
}

interface TrackMapClientProps {
  center: [number, number];
  delivery: TrackMapDelivery;
  hasPosition: boolean;
  destination?: [number, number];
}

function addDriverLayer(
  map: MapLibreMap,
  lng: number = 0,
  lat: number = 0,
): void {
  if (map.getSource(DRIVER_SOURCE_ID)) return;
  map.addSource(DRIVER_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [lng, lat] },
    },
  });
  map.addLayer({
    id: DRIVER_LAYER_ID,
    type: "circle",
    source: DRIVER_SOURCE_ID,
    paint: {
      "circle-radius": 10,
      "circle-color": "#3b82f6",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff",
    },
  });
}

function addRouteLayer(
  map: MapLibreMap,
  coordinates: [number, number][],
): void {
  if (map.getSource(ROUTE_SOURCE_ID) || coordinates.length === 0) return;
  map.addSource(ROUTE_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates },
    },
  });
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#3b82f6", "line-width": 4 },
  });
}

export function TrackMapClient({
  center,
  delivery,
  hasPosition,
  destination,
}: TrackMapClientProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isInitialView = useRef(true);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState<[number, number][] | null>(
    null,
  );

  const zoom = hasPosition ? 15 : 10;

  // Effect to create and destroy the map instance
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: getMapStyle(isDark),
        center: [7.7, 48.7],
        zoom,
        interactive: true,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        setIsMapLoaded(true);
      });
    });

    return () => {
      cancelled = true;
      setIsMapLoaded(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to sync map style with theme
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    mapRef.current.setStyle(getMapStyle(isDark));
  }, [isDark, isMapLoaded]);

  // Effect to sync map view (center/zoom) with props
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    const [longitude, latitude] = center;
    console.log("[TrackMapClient] center (map view)", {
      longitude,
      latitude,
      zoom,
    });
    if (isInitialView.current) {
      mapRef.current.jumpTo({ center, zoom });
      isInitialView.current = false;
    } else {
      mapRef.current.flyTo({ center, zoom, duration: 2000, essential: true });
    }
  }, [center, zoom, isMapLoaded]);

  // Effect to update driver marker
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) return;

    const source = map.getSource(DRIVER_SOURCE_ID) as GeoJSONSource | undefined;

    if (hasPosition && delivery.longitude && delivery.latitude) {
      const coordinates = [delivery.longitude, delivery.latitude];
      const geojsonData = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates },
      };
      if (source) {
        source.setData(geojsonData);
      } else {
        addDriverLayer(map, coordinates[0], coordinates[1]);
      }
    } else if (source) {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [hasPosition, delivery.latitude, delivery.longitude, isMapLoaded]);

  // Route fetching and layer updates
  const fetchRoute = useCallback(async () => {
    if (!destination || !delivery.latitude || !delivery.longitude) {
      setRouteGeoJSON(null);
      return;
    }
    // Implement your route fetching logic here, e.g., with OSRM or another service
  }, [delivery.latitude, delivery.longitude, destination]);

  useEffect(() => {
    void fetchRoute();
  }, [fetchRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) return;

    const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;

    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeGeoJSON ?? [],
        },
      });
    } else if (routeGeoJSON && routeGeoJSON.length > 0) {
      addRouteLayer(map, routeGeoJSON);
    }
  }, [routeGeoJSON, isMapLoaded]);

  return (
    <div
      ref={containerRef}
      className="relative isolate -z-40 h-full min-h-[400px] w-full"
    >
      {hasPosition &&
        delivery.latitude != null &&
        delivery.longitude != null && (
          <div
            className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow dark:border-gray-700 dark:bg-gray-900/95"
            aria-hidden
          >
            <div className="flex items-center gap-2 text-center text-gray-900 dark:text-gray-100">
              <MapPin className="h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium">Position actuelle</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(delivery.updated_at).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
