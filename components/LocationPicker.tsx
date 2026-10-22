"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_ATTRIBUTION, TILE_URL, type LatLng } from "@/lib/map";
import { inputCls } from "./Modal";

function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  // Moves the view only when a new search result arrives, so manual panning is never fought.
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16);
  }, [map, target]);
  return null;
}

type Hit = { lat: string; lon: string };

/**
 * Click the map to place the incident, or search an address. Address search uses OpenStreetMap's
 * Nominatim, only when the button is pressed (their usage policy forbids search-as-you-type).
 */
export default function LocationPicker({
  value, onChange, initialQuery = "",
}: { value: LatLng | null; onChange: (p: LatLng | null) => void; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setNote(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(query.trim())}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error();
      const hits = (await res.json()) as Hit[];
      if (hits.length === 0) { setNote("No match. Try a nearby landmark or click the map."); return; }
      const p = { lat: Number(hits[0].lat), lng: Number(hits[0].lon) };
      onChange(p);
      setFlyTarget(p);
    } catch {
      setNote("Address search is unavailable. Click the map instead.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search an address or landmark"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void search(); } }} className={inputCls} />
        <button type="button" onClick={search} disabled={searching || !query.trim()}
          className="rounded border px-3 text-sm disabled:opacity-50">{searching ? "..." : "Find"}</button>
      </div>
      <MapContainer center={value ? [value.lat, value.lng] : DEFAULT_CENTER} zoom={value ? 16 : DEFAULT_ZOOM}
        className="isolate h-56 w-full rounded border">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <ClickToPlace onPick={onChange} />
        <FlyTo target={flyTarget} />
        {value && (
          <CircleMarker center={[value.lat, value.lng]} radius={9}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#b91c1c", fillOpacity: 1 }} />
        )}
      </MapContainer>
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>{note ?? (value ? `Pinned at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : "Click the map to place the incident.")}</span>
        {value && <button type="button" onClick={() => onChange(null)} className="text-red-600">Clear pin</button>}
      </div>
    </div>
  );
}
