import type { Incident } from "./api";

// Default view when nothing is pinned yet. Override with NEXT_PUBLIC_MAP_CENTER="lat,lng"
// (set it to the brigade's own town). Falls back to Manila.
const MANILA: [number, number] = [14.5995, 120.9842];

function envCenter(): [number, number] {
  const raw = process.env.NEXT_PUBLIC_MAP_CENTER;
  if (raw) {
    const [lat, lng] = raw.split(",").map((n) => Number(n.trim()));
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return [lat, lng];
  }
  return MANILA;
}

export const DEFAULT_CENTER = envCenter();
export const DEFAULT_ZOOM = 12;
/** Radius of the red area drawn around each incident. */
export const INCIDENT_RADIUS_M = 200;

// OpenStreetMap's public tile server. Needs internet; fine for light use. Swap for a self-hosted
// or paid tile provider if the station ever needs heavier use or offline maps.
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export type Placed = Incident & { latitude: number; longitude: number };

export const hasPosition = (i: Incident): i is Placed => i.latitude != null && i.longitude != null;

export type LatLng = { lat: number; lng: number };
