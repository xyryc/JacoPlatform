type Coordinates = {
  lat: number;
  lng: number;
};

type BigDataCloudResponse = {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  postcode?: string;
};

const formatAddress = (area: string, district: string, zip: string) =>
  [area || "Area unavailable", district || "District unavailable", zip || "ZIP N/A"].join(", ");

export async function resolveAddressFromCoordinates(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!response.ok) return formatAddress("", "", "");
    const data = (await response.json()) as BigDataCloudResponse;
    return formatAddress(data.locality || data.city || "", data.principalSubdivision || "", data.postcode || "");
  } catch {
    return formatAddress("", "", "");
  }
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const query = String(address || "").trim();
  if (!query) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "jacob-mobile/1.0",
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) return null;

    const results = (await response.json()) as { lat?: string; lon?: string }[];
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) return null;

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
