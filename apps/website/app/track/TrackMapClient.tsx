"use client";

import { fetchOSRMRoute } from "@/utils/osrm";
import { Crosshair, MapPin } from "lucide-react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

// --- Map Constants ---
const TILE_SOURCES = {
  light: {
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    tiles: [
      "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    ],
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  },
};

const DRIVER_SOURCE_ID = "driver-position";
const DRIVER_LAYER_ID = "driver-marker";
const ROUTE_SOURCE_ID = "route";
const ROUTE_LAYER_ID = "route-line";
const DESTINATION_SOURCE_ID = "destination-marker";
const DESTINATION_LAYER_ID = "destination-flag";

// --- MapLibre Style Generator ---
function getMapStyle(isDark: boolean) {
  const { tiles, attribution } = isDark
    ? TILE_SOURCES.dark
    : TILE_SOURCES.light;
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

// --- Component Interfaces ---
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
  onRouteFetched?: (durationSeconds: number | null) => void;
}

// --- Map Layer Helpers ---
function addOrUpdateSource(
  map: MapLibreMap,
  id: string,
  data: GeoJSON.Feature | GeoJSON.FeatureCollection,
) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
  } else {
    map.addSource(id, { type: "geojson", data });
  }
}

/**
 * The client-side map component responsible for rendering the map,
 * driver position, and route line.
 */
export function TrackMapClient({
  center,
  delivery,
  hasPosition,
  destination,
  onRouteFetched,
}: TrackMapClientProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isInitialLoad = useRef(true); // Used to differentiate initial jump from subsequent flights.
  const isProgrammaticMove = useRef(false); // True when we trigger flyTo/jumpTo, so we don't mark as user interaction.
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const setUserHasInteractedRef = useRef(setUserHasInteracted);
  setUserHasInteractedRef.current = setUserHasInteracted;
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // --- Effect 1: Map Instance Management ---
  // This effect runs ONLY ONCE to create and destroy the map instance.
  // It has an empty dependency array to prevent re-initialization.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    let map: MapLibreMap;
    import("maplibre-gl").then((maplibregl) => {
      // If the component has unmounted by the time the import finishes, do nothing.
      if (!containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: getMapStyle(isDark),
        center: center, // Use the initial center prop.
        zoom: hasPosition ? 15 : 10,
        minZoom: 0,
        interactive: true,
        touchZoomRotate: true,
      });

      map.addControl(new maplibregl.NavigationControl(), "bottom-right");
      mapRef.current = map;
      map.on("load", () => setIsMapLoaded(true));

      // Track user pan/zoom so we don't auto-recenter when they've manually moved the map.
      map.on("moveend", () => {
        if (isProgrammaticMove.current) {
          isProgrammaticMove.current = false;
          return;
        }
        setUserHasInteractedRef.current(true);
      });
    });

    // Cleanup function: ensures the map is properly removed when the component unmounts.
    return () => {
      setIsMapLoaded(false);
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- Empty array ensures this runs only once.

  // --- Effect 2: Map Style Management ---
  // Syncs the map's visual style with the application's light/dark theme.
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      mapRef.current.setStyle(getMapStyle(isDark));
    }
  }, [isDark, isMapLoaded]);

  // --- Effect 3: Map View Management ---
  // Moves the map's camera to center on the driver's position.
  // Only auto-recenter if the user hasn't manually panned/zoomed (Waze-like behavior).
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    const zoom = hasPosition ? 15 : 10;

    if (isInitialLoad.current) {
      isProgrammaticMove.current = true;
      mapRef.current.jumpTo({ center, zoom });
      isInitialLoad.current = false;
    } else if (!userHasInteracted) {
      isProgrammaticMove.current = true;
      mapRef.current.flyTo({ center, zoom, duration: 2000, essential: true });
    }
  }, [center, hasPosition, isMapLoaded, userHasInteracted]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const zoom = hasPosition ? 15 : 10;
    setUserHasInteracted(false); // Resume auto-follow after recenter.
    isProgrammaticMove.current = true;
    mapRef.current.flyTo({ center, zoom, duration: 800 });
  };

  // --- Effect 4: Driver Marker Data Layer ---
  // Updates the GeoJSON source for the driver's marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) return;

    if (hasPosition && delivery.longitude && delivery.latitude) {
      const coordinates: [number, number] = [
        delivery.longitude,
        delivery.latitude,
      ];
      addOrUpdateSource(map, DRIVER_SOURCE_ID, {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates },
      });
      if (!map.getLayer(DRIVER_LAYER_ID)) {
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
    }
  }, [hasPosition, delivery.longitude, delivery.latitude, isMapLoaded]);

  // --- Effect 5: Route Data Layer ---
  // Fetches and displays the route from the driver to the destination.
  // Includes cleanup logic to prevent race conditions.
  useEffect(() => {
    const map = mapRef.current;
    if (
      !isMapLoaded ||
      !map ||
      !destination ||
      !delivery.latitude ||
      !delivery.longitude
    ) {
      // If there's no destination or driver position, clear any existing route.
      if (map && map.getSource(ROUTE_SOURCE_ID)) {
        addOrUpdateSource(map, ROUTE_SOURCE_ID, {
          type: "FeatureCollection",
          features: [],
        });
      }
      onRouteFetched?.(null);
      return;
    }

    let isCancelled = false; // Flag to ignore stale fetch results.

    const fetchAndDrawRoute = async () => {
      const from: [number, number] = [delivery.longitude!, delivery.latitude!];
      const result = await fetchOSRMRoute(from, destination);

      // If the component has unmounted or dependencies have changed,
      // the 'isCancelled' flag will be true, and we discard the result.
      if (isCancelled || !mapRef.current) return;

      if (result?.coordinates?.length) {
        addOrUpdateSource(mapRef.current, ROUTE_SOURCE_ID, {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: result.coordinates },
        });
        if (!mapRef.current.getLayer(ROUTE_LAYER_ID)) {
          mapRef.current.addLayer({
            id: ROUTE_LAYER_ID,
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#3b82f6", "line-width": 5 },
          });
        }
        onRouteFetched?.(result.durationSeconds ?? null);
      } else {
        onRouteFetched?.(null);
      }
    };

    void fetchAndDrawRoute();

    // Cleanup function: when dependencies change, this runs first,
    // ensuring that any in-flight fetch is ignored.
    return () => {
      isCancelled = true;
    };
  }, [
    delivery.latitude,
    delivery.longitude,
    destination,
    isMapLoaded,
    onRouteFetched,
  ]);

  // --- Effect 6: Destination Flag Marker ---
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) return;

    if (destination) {
      addOrUpdateSource(map, DESTINATION_SOURCE_ID, {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: destination },
      });
      if (!map.getLayer(DESTINATION_LAYER_ID)) {
        map.addLayer({
          id: DESTINATION_LAYER_ID,
          type: "circle",
          source: DESTINATION_SOURCE_ID,
          paint: {
            "circle-radius": 10,
            "circle-color": "#22c55e",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
      }
    } else if (map.getSource(DESTINATION_SOURCE_ID)) {
      addOrUpdateSource(map, DESTINATION_SOURCE_ID, {
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [destination, isMapLoaded]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10 h-full w-full"
      style={{ touchAction: "manipulation" }}
    >
      {hasPosition && userHasInteracted && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute bottom-24 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg transition hover:bg-white dark:border-gray-700 dark:bg-gray-900/95 dark:hover:bg-gray-800"
          aria-label="Recentrer sur ma position"
          title="Recentrer sur ma position"
        >
          <Crosshair className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}
      {hasPosition && (
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
