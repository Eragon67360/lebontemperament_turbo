'use client'
import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";

function Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: 'weekly'
      });


      const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;;
      const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      const position = {
        lat: 48.738602,
        lng: 7.363074
      }

      const mapOptions: google.maps.MapOptions = {
        center: position,
        zoom: 17,
      }

      const map = new Map(mapRef.current as HTMLDivElement, mapOptions);
      const marker = new Marker({
        map: map,
        position: position
      })


    }
    initMap();
  }, [])

  return (
    <div className="w-full" ref={mapRef} />
  )

}
export default Map;