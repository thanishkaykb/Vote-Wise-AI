// Real-time booth prediction using OpenStreetMap.
// Strategy:
//   1) Geocode user's city/locality via Nominatim (India-biased)
//   2) Query Overpass for schools/community halls/govt offices in expanding radii
//   3) If Overpass is empty or fails, FALL BACK to Nominatim POI search
//      (which works even when Overpass is rate-limited or the area is
//      under-tagged with amenity=*)
//   4) Return up to 3 closest, sorted by distance.

export type PredictedBooth = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  type: string;
  lat: number;
  lon: number;
};

type GeoResult = { lat: number; lon: number; displayName: string };

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const cache = new Map<string, { ts: number; booths: PredictedBooth[]; geo: GeoResult }>();
const TTL = 1000 * 60 * 30;

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
  const url = `${NOMINATIM_SEARCH}?q=${encodeURIComponent(city + ", India")}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
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
    out center tags 60;
  `;
}

type OverpassEl = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function fetchOverpass(
  lat: number,
  lon: number,
  radiusM: number,
  signal?: AbortSignal
): Promise<OverpassEl[]> {
  const body = buildOverpassQuery(lat, lon, radiusM);
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body,
        signal,
        headers: { "Content-Type": "text/plain" },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassEl[] };
      if (json.elements && json.elements.length) return json.elements;
    } catch (e) {
      if ((e as any)?.name === "AbortError") throw e;
      // try next endpoint
    }
  }
  return [];
}

// Nominatim fallback — search for schools/colleges near the geocoded point.
// This works even when Overpass is dead or the area lacks amenity=* tags.
async function fetchNominatimPOIs(
  geo: GeoResult,
  signal?: AbortSignal
): Promise<PredictedBooth[]> {
  // viewbox: ~10km box around the point
  const dLat = 0.09; // ~10 km
  const dLon = 0.09;
  const left = geo.lon - dLon;
  const right = geo.lon + dLon;
  const top = geo.lat + dLat;
  const bottom = geo.lat - dLat;
  const viewbox = `${left},${top},${right},${bottom}`;

  const queries = [
    "school",
    "government school",
    "higher secondary school",
    "community hall",
    "panchayat office",
    "anganwadi",
  ];

  const results: PredictedBooth[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (results.length >= 8) break;
    const url =
      `${NOMINATIM_SEARCH}?q=${encodeURIComponent(q)}` +
      `&format=json&limit=10&addressdetails=1&bounded=1&viewbox=${encodeURIComponent(viewbox)}` +
      `&countrycodes=in`;
    try {
      const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{
        place_id: number;
        lat: string;
        lon: string;
        display_name: string;
        type?: string;
        class?: string;
        address?: Record<string, string>;
      }>;
      for (const r of data) {
        const lat = parseFloat(r.lat);
        const lon = parseFloat(r.lon);
        const name = r.display_name.split(",")[0].trim();
        const key = `${name}|${Math.round(lat * 1000)}|${Math.round(lon * 1000)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const ad = r.address ?? {};
        const address =
          [ad.road, ad.suburb || ad.neighbourhood, ad.city || ad.town || ad.village]
            .filter(Boolean)
            .join(", ") || r.display_name.split(",").slice(1, 4).join(",").trim();
        results.push({
          id: `nom-${r.place_id}`,
          name,
          address: address || "Address not on file",
          distanceKm: Math.round(haversineKm(geo.lat, geo.lon, lat, lon) * 10) / 10,
          type:
            q.includes("school") ? "School" :
            q.includes("community") ? "Community Hall" :
            q.includes("panchayat") ? "Panchayat Office" :
            q.includes("anganwadi") ? "Anganwadi / Pre-school" :
            "Public Building",
          lat,
          lon,
        });
      }
    } catch (e) {
      if ((e as any)?.name === "AbortError") throw e;
    }
  }
  return results;
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
  return tags["addr:full"] || tags["operator"] || "Address not on file";
}

export async function predictBooths(
  city: string,
  signal?: AbortSignal
): Promise<{ booths: PredictedBooth[]; geo: GeoResult } | null> {
  const key = city.trim().toLowerCase();
  if (!key) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) {
    return { booths: hit.booths, geo: hit.geo };
  }

  const geo = await geocode(city, signal);
  if (!geo) return null;

  // 1) Try Overpass with expanding radii
  const radii = [2000, 5000, 10000, 20000];
  let elements: OverpassEl[] = [];
  for (const r of radii) {
    try {
      const res = await fetchOverpass(geo.lat, geo.lon, r, signal);
      if (res.length) {
        elements = res;
        if (res.length >= 3) break;
      }
    } catch (e) {
      if ((e as any)?.name === "AbortError") return null;
    }
  }

  let booths: PredictedBooth[] = elements
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
    .filter((b): b is PredictedBooth => b !== null && !!b.name);

  // 2) Fallback to Nominatim POI search if Overpass came back empty
  if (booths.length < 3) {
    try {
      const fallback = await fetchNominatimPOIs(geo, signal);
      const merged = [...booths, ...fallback];
      // de-dup by name
      const seen = new Set<string>();
      booths = merged.filter((b) => {
        const k = b.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    } catch (e) {
      if ((e as any)?.name === "AbortError") return null;
    }
  }

  booths = booths
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  cache.set(key, { ts: Date.now(), booths, geo });
  return { booths, geo };
}
