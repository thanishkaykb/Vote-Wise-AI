import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  query: z.string().trim().min(3).max(180),
});

type GeoCandidate = {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  address?: Record<string, string>;
};

type GeoResult = {
  lat: number;
  lon: number;
  displayName: string;
  localityText: string;
};

type OverpassEl = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type PredictedBooth = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  type: string;
  lat: number;
  lon: number;
};

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];
const LOOKUP_TIMEOUT_MS = 6500;
const STOP_WORDS = new Set([
  "india",
  "street",
  "road",
  "nagar",
  "main",
  "near",
  "west",
  "east",
  "north",
  "south",
  "the",
]);

function getSignal(signal?: AbortSignal, timeoutMs = LOOKUP_TIMEOUT_MS) {
  return signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s,]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[\s,]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildGeocodeCandidates(query: string) {
  const trimmed = query.trim().replace(/\s+/g, " ");
  const withoutCountry = trimmed.replace(/,?\s*india$/i, "").trim();
  const withoutPin = withoutCountry.replace(/\b\d{6}\b/g, "").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").trim();
  const parts = withoutPin.split(",").map((part) => part.trim()).filter(Boolean);

  const candidates = [trimmed, withoutCountry, `${withoutCountry}, India`, withoutPin, `${withoutPin}, India`];

  for (let start = 0; start < parts.length; start += 1) {
    const partial = parts.slice(start).join(", ");
    candidates.push(partial, `${partial}, India`);
  }

  if (parts.length >= 2) {
    candidates.push(parts.slice(-2).join(", "), `${parts.slice(-2).join(", ")}, India`);
  }

  return uniqueStrings(candidates);
}

async function searchNominatim(query: string, signal?: AbortSignal): Promise<GeoCandidate[]> {
  const url = `${NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=jsonv2&limit=6&addressdetails=1&countrycodes=in`;
  const res = await fetch(url, {
    signal: getSignal(signal),
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as GeoCandidate[];
}

function geocodeScore(candidate: GeoCandidate, fullQuery: string, queryTokens: string[], variantIndex: number) {
  const haystack = normalizeText(
    [
      candidate.display_name,
      candidate.address?.suburb,
      candidate.address?.neighbourhood,
      candidate.address?.city,
      candidate.address?.town,
      candidate.address?.village,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const tokenMatches = queryTokens.filter((token) => haystack.includes(token)).length;
  const exactPhraseBonus = haystack.includes(fullQuery) ? 5 : 0;
  const importance = candidate.importance ?? 0;

  return tokenMatches * 4 + exactPhraseBonus + importance - variantIndex * 0.75;
}

async function geocode(query: string, signal?: AbortSignal): Promise<GeoResult | null> {
  const variants = buildGeocodeCandidates(query);
  const fullQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  let best: { score: number; candidate: GeoCandidate } | null = null;

  for (const [variantIndex, variant] of variants.entries()) {
    const results = await searchNominatim(variant, signal);
    for (const candidate of results) {
      const score = geocodeScore(candidate, fullQuery, queryTokens, variantIndex);
      if (!best || score > best.score) {
        best = { score, candidate };
      }
    }
  }

  if (!best) return null;

  return {
    lat: parseFloat(best.candidate.lat),
    lon: parseFloat(best.candidate.lon),
    displayName: best.candidate.display_name,
    localityText: normalizeText(best.candidate.display_name),
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
    out center tags 80;
  `;
}

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

async function fetchOverpass(lat: number, lon: number, radiusM: number, signal?: AbortSignal): Promise<OverpassEl[]> {
  const body = buildOverpassQuery(lat, lon, radiusM);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body,
        signal: getSignal(signal),
        headers: { "Content-Type": "text/plain" },
      });

      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassEl[] };
      const elements = json.elements ?? [];
      if (elements.length) return elements;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
    }
  }

  return [];
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

function boothTypeWeight(type: string) {
  if (type === "School") return 5;
  if (type === "Community Hall") return 4;
  if (type === "Govt Office") return 3;
  if (type === "College" || type === "University") return 2;
  return 1;
}

function boothScore(booth: PredictedBooth, geo: GeoResult, query: string) {
  const haystack = normalizeText(`${booth.name} ${booth.address} ${geo.displayName}`);
  const queryTokens = tokenize(query);
  const localityMatches = queryTokens.filter((token) => haystack.includes(token)).length;
  return boothTypeWeight(booth.type) * 4 + localityMatches * 2 - booth.distanceKm * 1.5;
}

async function fetchNominatimFallback(geo: GeoResult, query: string, signal?: AbortSignal) {
  const dLat = 0.045;
  const dLon = 0.045;
  const left = geo.lon - dLon;
  const right = geo.lon + dLon;
  const top = geo.lat + dLat;
  const bottom = geo.lat - dLat;
  const viewbox = `${left},${top},${right},${bottom}`;
  const searchTerms = [
    `${query} school`,
    `${query} government school`,
    `${query} community hall`,
    `${query} panchayat office`,
    `${query} polling booth`,
  ];

  const seen = new Set<string>();
  const booths: PredictedBooth[] = [];

  for (const term of searchTerms) {
    const url = `${NOMINATIM_SEARCH}?q=${encodeURIComponent(term)}&format=jsonv2&limit=8&addressdetails=1&bounded=1&viewbox=${encodeURIComponent(viewbox)}&countrycodes=in`;
    try {
      const res = await fetch(url, {
        signal: getSignal(signal),
        headers: {
          Accept: "application/json",
          "Accept-Language": "en",
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<GeoCandidate & { place_id?: number; type?: string }>;
      for (const item of data) {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const distanceKm = Math.round(haversineKm(geo.lat, geo.lon, lat, lon) * 10) / 10;
        if (distanceKm > 5) continue;

        const name = item.display_name.split(",")[0].trim();
        const key = `${name.toLowerCase()}|${Math.round(lat * 1000)}|${Math.round(lon * 1000)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const address = [
          item.address?.road,
          item.address?.suburb || item.address?.neighbourhood,
          item.address?.city || item.address?.town || item.address?.village,
        ]
          .filter(Boolean)
          .join(", ") || item.display_name.split(",").slice(1, 4).join(",").trim();

        booths.push({
          id: `nom-${item.place_id ?? key}`,
          name,
          address: address || "Address not on file",
          distanceKm,
          type: term.includes("community") ? "Community Hall" : term.includes("office") ? "Govt Office" : "School",
          lat,
          lon,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
    }
  }

  return booths;
}

function dedupeAndRank(booths: PredictedBooth[], geo: GeoResult, query: string) {
  const seen = new Set<string>();
  const unique = booths.filter((booth) => {
    const key = `${booth.name.toLowerCase()}|${Math.round(booth.lat * 1000)}|${Math.round(booth.lon * 1000)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(booth.name);
  });

  return unique
    .sort((a, b) => {
      const scoreDiff = boothScore(b, geo, query) - boothScore(a, geo, query);
      if (scoreDiff !== 0) return scoreDiff;
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, 3);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid lookup input", details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query } = parsed.data;
    const geo = await geocode(query);
    if (!geo) {
      return new Response(JSON.stringify({ booths: [], geo: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nearby: PredictedBooth[] = [];
    for (const radius of [1500, 3000, 5000]) {
      const elements = await fetchOverpass(geo.lat, geo.lon, radius);
      for (const el of elements) {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat == null || lon == null) continue;

        const distanceKm = Math.round(haversineKm(geo.lat, geo.lon, lat, lon) * 10) / 10;
        if (distanceKm > Math.max(5, radius / 1000 + 0.5)) continue;

        const tags = el.tags ?? {};
        const type = humanType(tags);
        const name = tags.name || tags["name:en"] || "";
        if (!name) continue;

        nearby.push({
          id: `${el.type}-${el.id}`,
          name,
          address: buildAddress(tags),
          distanceKm,
          type,
          lat,
          lon,
        });
      }

      if (nearby.length >= 3) break;
    }

    let booths = dedupeAndRank(nearby, geo, query);

    if (booths.length < 3) {
      const fallback = await fetchNominatimFallback(geo, query);
      booths = dedupeAndRank([...booths, ...fallback], geo, query);
    }

    return new Response(JSON.stringify({ booths, geo }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});