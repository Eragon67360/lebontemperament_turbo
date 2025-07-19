"use client";
import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";

function Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
          version: "weekly",
          libraries: ["places"], // Ensure you specify any required libraries
        });

        // Load the maps library
        const { Map } = (await loader.importLibrary(
          "maps",
        )) as google.maps.MapsLibrary;
        // Load the marker library
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        const position = {
          lat: 48.738602,
          lng: 7.363074,
        };

        const mapOptions: google.maps.MapOptions = {
          center: position,
          zoom: 17,
        };

        const map = new Map(mapRef.current as HTMLDivElement, mapOptions);
        new AdvancedMarkerElement({
          map: map,
          position: position,
        });
      } catch (e) {
        console.error("Error loading Google Maps: ", e);
      }
    };

    initMap();
  }, []);

  return <div className="h-full w-full" ref={mapRef} />;
}

export default Map;
