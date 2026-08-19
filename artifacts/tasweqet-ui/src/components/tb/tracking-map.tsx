import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Point = { lat: number; lng: number };

const driverIcon = L.divIcon({
  className: "",
  html: '<div style="display:flex;width:38px;height:38px;align-items:center;justify-content:center;border:3px solid white;border-radius:999px;background:#00875a;box-shadow:0 4px 12px #0003;font-size:20px">🛵</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const destinationIcon = L.divIcon({
  className: "",
  html: '<div style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:3px solid white;border-radius:999px;background:#e75b3b;box-shadow:0 4px 12px #0003;font-size:18px">⌂</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

function FitTrackingBounds({ driver, destination }: { driver: Point; destination: Point }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [[driver.lat, driver.lng], [destination.lat, destination.lng]],
      { padding: [42, 42], maxZoom: 16 },
    );
  }, [destination.lat, destination.lng, driver.lat, driver.lng, map]);
  return null;
}

export function TrackingMap({
  driver,
  destination,
  heightClass = "h-64",
}: {
  driver: Point;
  destination: Point;
  heightClass?: string;
}) {
  const center = useMemo<[number, number]>(
    () => [(driver.lat + destination.lat) / 2, (driver.lng + destination.lng) / 2],
    [destination.lat, destination.lng, driver.lat, driver.lng],
  );
  return (
    <div className={`overflow-hidden rounded-card border border-outline-variant ${heightClass}`} dir="ltr">
      <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
        <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />
        <FitTrackingBounds driver={driver} destination={destination} />
      </MapContainer>
    </div>
  );
}