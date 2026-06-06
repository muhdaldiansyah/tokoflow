import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode?lat=&lon=
 *
 * Server-side reverse geocoding proxy — key never in client JS.
 * Primary:  HERE Maps (250K/mo free, no CC, best MY building-level quality)
 * Fallback: Nominatim (OpenStreetMap) when HERE_API_KEY is not set
 *
 * Returns { address: string } — formatted Malaysian address ready for the
 * delivery address textarea in the customer order form.
 *
 * To enable HERE: set HERE_API_KEY in Vercel env (see CLAUDE.md).
 * Without the key, Nominatim is used automatically — no setup required.
 */
export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  if (isNaN(parsedLat) || isNaN(parsedLon)) {
    return NextResponse.json({ error: "lat and lon must be valid numbers" }, { status: 400 });
  }

  // Sanity-check: coordinates must be within or near Indonesia
  // (lat ~6°N Sabang to ~11°S Rote; lon ~95°E Aceh to ~141°E Papua).
  if (parsedLat < -11.5 || parsedLat > 6.5 || parsedLon < 94.5 || parsedLon > 141.5) {
    return NextResponse.json({ error: "Coordinates out of range for Indonesia" }, { status: 400 });
  }

  const hereApiKey = process.env.HERE_API_KEY;

  try {
    if (hereApiKey) {
      return await geocodeWithHere(parsedLat, parsedLon, hereApiKey);
    }
    return await geocodeWithNominatim(parsedLat, parsedLon);
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}

async function geocodeWithHere(lat: number, lon: number, apiKey: string): Promise<NextResponse> {
  const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=en&apiKey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`HERE API error: ${res.status}`);
  const data = await res.json();

  const item = data?.items?.[0];
  if (!item) return NextResponse.json({ address: "" });

  const a = item.address || {};
  const line1 = [a.houseNumber, a.street].filter(Boolean).join(" ");
  const suburb = a.district || a.subdistrict || "";
  const line1Full = [line1, suburb].filter(Boolean).join(", ");
  const postcode = (a.postalCode || "") as string;
  const city = (a.city || a.county || "") as string;
  const state = (a.state || "") as string;

  const postCity = [postcode, city].filter(Boolean).join(" ");
  const parts = [line1Full, postCity, state].filter(Boolean);
  const address = parts.join(", ");

  return NextResponse.json({ address, line1: line1Full, postcode, city, state }, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}

async function geocodeWithNominatim(lat: number, lon: number): Promise<NextResponse> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en&zoom=18`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Tokoflow/1.0 (https://tokoflow.com)",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json();

  const a = (data.address || {}) as Record<string, string>;

  // Suppress road name when GPS snaps to a highway/motorway — "North-South
  // Expressway" is useless as a delivery address line.
  const isHighway = data.class === "highway" || data.category === "highway";
  const road = !isHighway && a.road ? [a.house_number, a.road].filter(Boolean).join(" ") : "";
  const suburb = a.neighbourhood || a.suburb || a.quarter || a.village || "";
  const line1Full = [road, suburb].filter(Boolean).join(", ");
  const postcode = a.postcode || "";
  const city = a.city || a.town || a.municipality || "";
  const state = a.state || "";

  const postCity = [postcode, city].filter(Boolean).join(" ");
  const parts = [line1Full, postCity, state].filter(Boolean);
  const address = parts.join(", ") || data.display_name?.replace(/, Indonesia$/, "") || "";

  return NextResponse.json({ address, line1: line1Full, postcode, city, state }, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
