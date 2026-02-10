"use client";

import { fetchOSRMRoute } from "@/utils/osrm";
import { Crosshair, MapPin, Maximize2 } from "lucide-react";
import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

// --- Mapbox Standard style ---
const MAPBOX_STANDARD_STYLE = "mapbox://styles/mapbox/standard";

/** Light presets for Mapbox Standard: day (light), night (dark). */
const LIGHT_PRESET = { light: "day" as const, dark: "night" as const };

function getLightPreset(isDark: boolean): "day" | "night" {
  return isDark ? LIGHT_PRESET.dark : LIGHT_PRESET.light;
}

const DRIVER_SOURCE_ID = "driver-position";
const DRIVER_LAYER_ID = "driver-marker";
const ROUTE_SOURCE_ID = "route";
const ROUTE_LAYER_ID = "route-line";
const DESTINATION_SOURCE_ID = "destination-marker";
const DESTINATION_LAYER_ID = "destination-flag";

const DRIVER_ICON_ID = "driver-icon";
const DESTINATION_ICON_ID = "destination-icon";

// Paths to images in the public directory
const DRIVER_ICON_URL = "/img/cheese.png";
const DESTINATION_ICON_URL = "/img/race-flag.png";

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
  map: MapboxMap,
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
  const mapRef = useRef<MapboxMap | null>(null);

  const isInitialLoad = useRef(true);
  const isProgrammaticMove = useRef(false);

  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const setUserHasInteractedRef = useRef(setUserHasInteracted);
  setUserHasInteractedRef.current = setUserHasInteracted;

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const lastStyleDarkRef = useRef<boolean | null>(null);

  // Controls when it is safe to add layers that depend on images
  const [iconsReady, setIconsReady] = useState(false);

  // --- Effect 1: Map Instance Management & Console Patch ---
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    // 1. Patch console.warn to suppress internal Mapbox warnings we can't control
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (
        msg.includes("featureNamespace place-A") ||
        msg.includes("The map container element should be empty")
      ) {
        return;
      }
      originalWarn(...args);
    };

    const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
    if (!token) {
      console.warn("NEXT_PUBLIC_MAPBOX_API_KEY is not set.");
    }

    // 2. Explicitly clear the container to fix "Map container element should be empty"
    containerRef.current.innerHTML = "";

    import("mapbox-gl").then((mod) => {
      const mapboxgl = mod.default;
      if (token) mapboxgl.accessToken = token;
      if (!containerRef.current) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STANDARD_STYLE,
        config: {
          basemap: { lightPreset: getLightPreset(isDark) },
        },
        center: center,
        zoom: hasPosition ? 15 : 10,
        minZoom: 0,
        interactive: true,
        touchZoomRotate: true,
      });

      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
      mapRef.current = map;

      map.on("load", () => {
        lastStyleDarkRef.current = isDark;
        setIsMapLoaded(true);
        // Increment styleVersion to trigger image loading
        setStyleVersion((v) => v + 1);
      });

      map.on("moveend", () => {
        if (isProgrammaticMove.current) {
          isProgrammaticMove.current = false;
          return;
        }
        setUserHasInteractedRef.current(true);
      });
    });

    return () => {
      // Restore console on cleanup
      console.warn = originalWarn;

      setIsMapLoaded(false);
      setIconsReady(false);
      const m = mapRef.current;
      if (m) {
        m.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Effect 2: Map Style Configuration ---
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    if (lastStyleDarkRef.current === isDark) return;

    lastStyleDarkRef.current = isDark;
    mapRef.current.setConfigProperty(
      "basemap",
      "lightPreset",
      getLightPreset(isDark),
    );
  }, [isDark, isMapLoaded]);

  // --- Effect 2b: Load PNG Images ---
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) return;

    setIconsReady(false);

    const loadIcon = (id: string, url: string): Promise<void> => {
      return new Promise((resolve) => {
        if (map.hasImage(id)) {
          resolve();
          return;
        }
        map.loadImage(url, (error, image) => {
          if (error) {
            console.error(`Failed to load PNG: ${url}`, error);
            // Resolve anyway so we don't block the other icon,
            // though the marker won't show.
            resolve();
            return;
          }
          if (image && !map.hasImage(id)) {
            map.addImage(id, image);
          }
          resolve();
        });
      });
    };

    Promise.all([
      loadIcon(DRIVER_ICON_ID, DRIVER_ICON_URL),
      loadIcon(DESTINATION_ICON_ID, DESTINATION_ICON_URL),
    ]).then(() => {
      setIconsReady(true);
    });
  }, [isMapLoaded, styleVersion]);

  // --- Effect 3: Map View Management ---
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
    setUserHasInteracted(false);
    isProgrammaticMove.current = true;
    mapRef.current.flyTo({ center, zoom, duration: 800 });
  };

  const handleFitBoth = () => {
    const map = mapRef.current;
    if (!map || !hasPosition || !destination) return;
    const lngs = [center[0], destination[0]];
    const lats = [center[1], destination[1]];
    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
    isProgrammaticMove.current = true;
    map.fitBounds([sw, ne], { padding: 40, maxZoom: 14, duration: 800 });
  };

  // --- Effect 4: Driver Marker Layer ---
  useEffect(() => {
    const map = mapRef.current;
    // CRITICAL: Do not attempt to add layers until icons are loaded
    if (!isMapLoaded || !map || !iconsReady) return;

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
          type: "symbol",
          source: DRIVER_SOURCE_ID,
          layout: {
            "icon-image": DRIVER_ICON_ID,
            "icon-size": 0.05, // Adjusted size for PNGs, tweak as needed
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        });
      }
    }
  }, [
    hasPosition,
    delivery.longitude,
    delivery.latitude,
    isMapLoaded,
    iconsReady,
    styleVersion,
  ]);

  // --- Effect 5: Route Line Layer ---
  useEffect(() => {
    const map = mapRef.current;
    if (
      !isMapLoaded ||
      !map ||
      !destination ||
      !delivery.latitude ||
      !delivery.longitude
    ) {
      if (map && map.getSource(ROUTE_SOURCE_ID)) {
        addOrUpdateSource(map, ROUTE_SOURCE_ID, {
          type: "FeatureCollection",
          features: [],
        });
      }
      onRouteFetched?.(null);
      return;
    }

    let isCancelled = false;

    const fetchAndDrawRoute = async () => {
      const from: [number, number] = [delivery.longitude!, delivery.latitude!];
      const result = await fetchOSRMRoute(from, destination);

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

    return () => {
      isCancelled = true;
    };
  }, [
    delivery.latitude,
    delivery.longitude,
    destination,
    isMapLoaded,
    onRouteFetched,
    styleVersion,
  ]);

  // --- Effect 6: Destination Marker Layer ---
  useEffect(() => {
    const map = mapRef.current;
    // CRITICAL: Do not attempt to add layers until icons are loaded
    if (!isMapLoaded || !map || !iconsReady) return;

    if (destination) {
      addOrUpdateSource(map, DESTINATION_SOURCE_ID, {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: destination },
      });

      if (!map.getLayer(DESTINATION_LAYER_ID)) {
        map.addLayer({
          id: DESTINATION_LAYER_ID,
          type: "symbol",
          source: DESTINATION_SOURCE_ID,
          layout: {
            "icon-image": DESTINATION_ICON_ID,
            "icon-size": 0.05, // Adjusted size for PNGs, tweak as needed
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        });
      }
    } else if (map.getSource(DESTINATION_SOURCE_ID)) {
      addOrUpdateSource(map, DESTINATION_SOURCE_ID, {
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [destination, isMapLoaded, iconsReady, styleVersion]);

  return (
    <div
      className="absolute inset-0 -z-10 h-full w-full"
      style={{ touchAction: "manipulation" }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      />
      {hasPosition && destination && (
        <button
          type="button"
          onClick={handleFitBoth}
          className="absolute bottom-18 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg transition hover:bg-white dark:border-gray-700 dark:bg-gray-900/95 dark:hover:bg-gray-800"
          aria-label="Afficher le trajet complet"
          title="Afficher le trajet complet"
        >
          <Maximize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}
      {hasPosition && userHasInteracted && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute bottom-32 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg transition hover:bg-white dark:border-gray-700 dark:bg-gray-900/95 dark:hover:bg-gray-800"
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
