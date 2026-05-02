// Real-time booth prediction using OpenStreetMap.
// Indian polling booths are almost always at: schools, community halls,
// panchayat offices, anganwadis, libraries. We:
//   1) Geocode the user's city/locality via Nominatim
//   2) Query Overpass for amenity=school|community_centre|library near it
//   3) Pick the 3 closest, sorted by distance
// All free, no API key, runs from the browser.

export type PredictedBooth = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  type: string; // "school", "community_centre", etc.
  lat: number;
  lon: number;
};

type GeoResult = { lat: number; lon: number; displayName: string };

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = "https://overpass-api.de/api/interpreter";

// Simple in-memory cache so we don't hammer the APIs while typing.
const cache = new Map<string, { ts: number; booths: PredictedBooth[]; geo: GeoResult }>();
const TTL = 1000 * 60 * 30; // 30 min

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function geocode(city: string, signal?: AbortSignal): Promise<GeoResult | null> {
  // bias to India for accuracy
  const url = `${NOMINATIM}?q=${encodeURIComponent(city + ", India")}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data?.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

function buildOverpassQuery(lat: number, lon: number, radiusM: number) {
  // Schools, colleges, community halls, libraries, town halls, govt offices,
  // kindergartens — the typical building types ECI assigns booths to.
  return `
    [out:json][timeout:25];
    (
      node["amenity"~"^(school|college|university|kindergarten|community_centre|library|townhall|public_building)$"](around:${radiusM},${lat},${lon});
      way["amenity"~"^(school|college|university|kindergarten|community_centre|library|townhall|public_building)$"](around:${radiusM},${lat},${lon});
      node["building"~"^(school|college|university|public|civic|government)$"](around:${radiusM},${lat},${lon});
      way["building"~"^(school|college|university|public|civic|government)$"](around:${radiusM},${lat},${lon});
      node["office"="government"](around:${radiusM},${lat},${lon});
      way["office"="government"](around:${radiusM},${lat},${lon});
    );
    out center tags 50;
  `;
}

async function fetchOverpass(lat: number, lon: number, radiusM: number, signal?: AbortSignal) {
  const body = buildOverpassQuery(lat, lon, radiusM);
  const res = await fetch(OVERPASS, {
    method: "POST",
    body,
    signal,
    headers: { "Content-Type": "text/plain" },
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  return (await res.json()) as {
    elements: Array<{
      id: number;
      type: "node" | "way" | "relation";
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };
}

function humanType(tags: Record<string, string> = {}) {
  const a = tags.amenity;
  const b = tags.building;
  const o = tags.office;
  if (a === "school" || b === "school") return "School";
  if (a === "college" || b === "college") return "College";
  if (a === "university" || b === "university") return "University";
  if (a === "kindergarten") return "Anganwadi / Pre-school";
  if (a === "community_centre") return "Community Hall";
  if (a === "library") return "Library";
  if (a === "townhall") return "Town Hall";
  if (o === "government" || b === "government" || b === "civic" || b === "public" || a === "public_building") return "Govt Office";
  return "Public Building";
}

function buildAddress(tags: Record<string, string> = {}) {
  const parts = [
    tags["addr:housename"],
    tags["addr:street"] || tags["addr:road"],
    tags["addr:suburb"] || tags["addr:neighbourhood"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");
  // fallback: any locality-ish tag
  return tags["addr:full"] || tags["operator"] || "Address not on file";
}

export async function predictBooths(city: string, signal?: AbortSignal): Promise<{
  booths: PredictedBooth[];
  geo: GeoResult;
} | null> {
  const key = city.trim().toLowerCase();
  if (!key) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) {
    return { booths: hit.booths, geo: hit.geo };
  }

  const geo = await geocode(city, signal);
  if (!geo) return null;

  // Try expanding radii until we have ≥3 candidates
  const radii = [1500, 3000, 6000, 12000];
  let elements: Awaited<ReturnType<typeof fetchOverpass>>["elements"] = [];
  for (const r of radii) {
    try {
      const res = await fetchOverpass(geo.lat, geo.lon, r, signal);
      elements = res.elements ?? [];
      if (elements.length >= 3) break;
    } catch {
      // fall through to next radius / give up
    }
  }

  const booths: PredictedBooth[] = elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;
      const tags = el.tags ?? {};
      const name = tags.name || tags["name:en"] || `Unnamed ${humanType(tags)}`;
      return {
        id: `${el.type}-${el.id}`,
        name,
        address: buildAddress(tags),
        distanceKm: Math.round(haversineKm(geo.lat, geo.lon, lat, lon) * 10) / 10,
        type: humanType(tags),
        lat,
        lon,
      } as PredictedBooth;
    })
    .filter((b): b is PredictedBooth => b !== null && !!b.name)
    // de-dup by name+address
    .filter((b, i, arr) => arr.findIndex((x) => x.name === b.name && x.address === b.address) === i)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  cache.set(key, { ts: Date.now(), booths, geo });
  return { booths, geo };
}
