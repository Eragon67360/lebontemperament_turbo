"use client";
import { useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

const POSITION = { lat: 48.738602, lng: 7.363074 };
const ADDRESS = "3 Rue Clemenceau, 67700 Saverne, France";
const GOOGLE_MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
const OPENSTREETMAP_LINK = `https://www.openstreetmap.org/?mlat=${POSITION.lat}&mlon=${POSITION.lng}#map=17/${POSITION.lat}/${POSITION.lng}`;

/**
 * The Google map loads only after the visitor asks for it: before the click
 * the page makes no request to Google, and the address stays reachable
 * through plain links to Google Maps and OpenStreetMap.
 */
function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requested) return;

    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

      if (!apiKey) {
        setError("La carte n’est pas configurée.");
        console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
        return;
      }

      try {
        // Imported here so the loader stays out of the page until the click.
        const { importLibrary, setOptions } =
          await import("@googlemaps/js-api-loader");
        setOptions({
          key: apiKey,
          v: "weekly",
          libraries: ["places"],
        });

        const { Map } = await importLibrary("maps");

        const mapOptions: google.maps.MapOptions = {
          center: POSITION,
          zoom: 17,
          ...(mapId && { mapId }), // Required for AdvancedMarkerElement
        };

        const map = new Map(mapRef.current as HTMLDivElement, mapOptions);

        if (mapId) {
          try {
            const { AdvancedMarkerElement } = await importLibrary("marker");
            new AdvancedMarkerElement({ map, position: POSITION });
            setError(null);
            return;
          } catch (markerError) {
            console.warn(
              "AdvancedMarkerElement failed, falling back to regular marker:",
              markerError,
            );
          }
        }

        // Fallback to the regular marker (works without billing/map ID)
        new google.maps.Marker({
          map,
          position: POSITION,
          title: "Le Bon Tempérament",
        });

        setError(null);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        console.error("Error loading Google Maps: ", e);

        if (
          errorMessage.includes("BillingNotEnabled") ||
          errorMessage.includes("billing")
        ) {
          setError("La carte est temporairement indisponible.");
        } else {
          setError("Impossible de charger la carte.");
        }
      }
    };

    initMap();
  }, [requested]);

  return (
    <div className="relative h-full w-full">
      {!requested && (
        <div className="bg-surface-tertiary/20 dark:bg-surface-secondary border-primary-300 dark:border-primary-700 absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center">
          <FaMapMarkerAlt
            className="text-primary text-3xl"
            aria-hidden="true"
          />
          <p className="text-foreground text-sm">
            {ADDRESS}
            <br />
            <span className="text-muted text-xs">
              La carte Google Maps se charge seulement si vous l’affichez.
            </span>
          </p>
          <button
            type="button"
            onClick={() => setRequested(true)}
            className="bg-primary-600 hover:bg-primary-700 focus-visible:outline-primary rounded-full px-5 py-2 text-xs font-medium tracking-[2.4px] text-white uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Afficher la carte
          </button>
          <p className="text-muted text-xs">
            Ouvrir dans{" "}
            <a
              href={GOOGLE_MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Google Maps
            </a>{" "}
            ou{" "}
            <a
              href={OPENSTREETMAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              OpenStreetMap
            </a>
          </p>
        </div>
      )}
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
