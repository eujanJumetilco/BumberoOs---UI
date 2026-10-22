"use client";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import {
  DEFAULT_CENTER, DEFAULT_ZOOM, INCIDENT_RADIUS_M, TILE_ATTRIBUTION, TILE_URL, type Placed,
} from "@/lib/map";

const RED = "#b91c1c";
const GRAY = "#6b7280";

/** Re-frames the map when the set of pinned incidents changes, not on every refresh. */
function FitToIncidents({ incidents }: { incidents: Placed[] }) {
  const map = useMap();
  const signature = incidents.map((i) => `${i.id}:${i.latitude}:${i.longitude}`).join("|");
  useEffect(() => {
    if (incidents.length === 0) return;
    if (incidents.length === 1) {
      map.setView([incidents[0].latitude, incidents[0].longitude], 15);
    } else {
      map.fitBounds(incidents.map((i) => [i.latitude, i.longitude] as [number, number]), { padding: [40, 40], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);
  return null;
}

export default function IncidentMap({
  incidents, selectedId, onSelect,
}: { incidents: Placed[]; selectedId: number | null; onSelect: (id: number) => void }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom
      className="isolate h-96 w-full rounded-lg">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
      <FitToIncidents incidents={incidents} />
      {incidents.map((i) => {
        const color = i.status === "ONGOING" ? RED : GRAY;
        const selected = i.id === selectedId;
        const handlers = { click: () => onSelect(i.id) };
        const center: [number, number] = [i.latitude, i.longitude];
        return (
          <span key={i.id}>
            {/* The area is only ~200 m wide, so the dot keeps the incident visible when zoomed out. */}
            <Circle center={center} radius={INCIDENT_RADIUS_M} bubblingMouseEvents={false} eventHandlers={handlers}
              pathOptions={{ color, weight: selected ? 4 : 2, fillColor: color, fillOpacity: selected ? 0.45 : 0.25 }} />
            <CircleMarker center={center} radius={selected ? 9 : 7} bubblingMouseEvents={false} eventHandlers={handlers}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: color, fillOpacity: 1 }} />
          </span>
        );
      })}
    </MapContainer>
  );
}
