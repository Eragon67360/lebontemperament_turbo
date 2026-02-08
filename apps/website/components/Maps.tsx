"use client";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

      // Check if API key is set
      if (!apiKey) {
        setError("Google Maps API key is not configured");
        console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
        return;
      }

      const position = {
        lat: 48.738602,
        lng: 7.363074,
      };

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
          libraries: ["places"],
        });

        // Load the maps library
        const { Map } = await importLibrary("maps");

        const mapOptions: google.maps.MapOptions = {
          center: position,
          zoom: 17,
          ...(mapId && { mapId }), // Add map ID if provided (required for AdvancedMarkerElement)
        };

        const map = new Map(mapRef.current as HTMLDivElement, mapOptions);

        // Try to use AdvancedMarkerElement if map ID is available
        if (mapId) {
          try {
            const { AdvancedMarkerElement } = await importLibrary("marker");
            new AdvancedMarkerElement({
              map: map,
              position: position,
            });
            setError(null);
            return;
          } catch (markerError: any) {
            console.warn(
              "AdvancedMarkerElement failed, falling back to regular marker:",
              markerError,
            );
            // Fall through to use regular marker
          }
        }

        // Fallback to regular marker (works without billing/map ID)
        new google.maps.Marker({
          map: map,
          position: position,
          title: "Le Bon Tempérament",
        });

        setError(null);
      } catch (e: any) {
        const errorMessage = e?.message || "Unknown error";
        console.error("Error loading Google Maps: ", e);

        // Check for specific billing error
        if (
          errorMessage.includes("BillingNotEnabled") ||
          errorMessage.includes("billing")
        ) {
          setError(
            "Google Maps billing is not enabled. Please enable billing in Google Cloud Console.",
          );
        } else {
          setError(`Error loading map: ${errorMessage}`);
        }
      }
    };

    initMap();
  }, []);

  return (
    <div className="relative h-full w-full">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2 font-semibold">Carte non disponible</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}
      <div className="h-full w-full" ref={mapRef} />
    </div>
  );
}

export default Map;
