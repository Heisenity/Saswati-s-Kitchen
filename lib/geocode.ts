export async function geocodeAddress(address: string) {
  const query = address.trim();
  if (query.length < 12) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "saswatis-kitchen/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Array<{ lat: string; lon: string }>;
  const match = data[0];
  if (!match) return null;

  const latitude = Number(match.lat);
  const longitude = Number(match.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}
