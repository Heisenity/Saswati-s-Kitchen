import { haversineDistanceKm } from "@/lib/delivery";
import { defaultKitchenCoordinates } from "@/lib/default-data";

type GeocodeCandidate = {
  lat: string;
  lon: string;
};

function normalizeQuery(address: string) {
  const query = address.trim().replace(/\s+/g, " ");
  if (query.toLowerCase().includes("barrackpore")) return query;
  return `${query}, Barrackpore, West Bengal, India`;
}

async function fetchCandidates(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "saswatis-kitchen/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) return [];
  return ((await response.json()) as GeocodeCandidate[]) ?? [];
}

export async function geocodeAddress(address: string) {
  const query = address.trim();
  if (query.length < 12) return null;

  const candidates = await fetchCandidates(normalizeQuery(query));
  const match = candidates
    .map((candidate) => ({
      latitude: Number(candidate.lat),
      longitude: Number(candidate.lon)
    }))
    .filter(
      (candidate) =>
        Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude)
    )
    .sort(
      (left, right) =>
        haversineDistanceKm(
          { lat: defaultKitchenCoordinates.latitude, lng: defaultKitchenCoordinates.longitude },
          { lat: left.latitude, lng: left.longitude }
        ) -
        haversineDistanceKm(
          { lat: defaultKitchenCoordinates.latitude, lng: defaultKitchenCoordinates.longitude },
          { lat: right.latitude, lng: right.longitude }
        )
    )[0];

  if (!match) return null;
  return match;
}
