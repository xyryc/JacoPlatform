type Coordinates = {
  lat: number;
  lng: number;
};

type MapboxFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  place_type?: string[];
  context?: Array<{ id?: string; text?: string; short_code?: string }>;
  properties?: {
    short_code?: string;
  };
};

type BigDataCloudResponse = {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  postcode?: string;
};

const formatAddress = (area: string, district: string, zip: string) =>
  [area || 'Area unavailable', district || 'District unavailable', zip || 'ZIP N/A'].join(', ');

const cleanValue = (value?: string | null) => (value || '').trim();

const firstNonEmpty = (...values: Array<string | undefined | null>) =>
  values.map(cleanValue).find(Boolean) || '';

const extractFeatureText = (features: MapboxFeature[], type: string) =>
  cleanValue(features.find((feature) => feature.place_type?.includes(type))?.text);

const extractContextText = (contexts: MapboxFeature['context'] | undefined, prefixes: string[]) => {
  if (!contexts?.length) return '';

  for (const prefix of prefixes) {
    const match = contexts.find((item) => item.id?.startsWith(prefix));
    const text = cleanValue(match?.text);
    if (text) return text;
  }

  return '';
};

const extractMapboxAddress = (features: MapboxFeature[]) => {
  const topFeature = features[0];
  const contexts = topFeature?.context || [];

  const area = firstNonEmpty(
    extractFeatureText(features, 'neighborhood'),
    extractFeatureText(features, 'locality'),
    extractFeatureText(features, 'address'),
    extractContextText(contexts, ['neighborhood.', 'locality.']),
    cleanValue(topFeature?.text),
    cleanValue(topFeature?.place_name?.split(',')?.[0])
  );

  const district = firstNonEmpty(
    extractContextText(contexts, ['district.', 'place.', 'region.']),
    extractFeatureText(features, 'district'),
    extractFeatureText(features, 'place'),
    extractFeatureText(features, 'region')
  );

  const zip = firstNonEmpty(
    extractContextText(contexts, ['postcode.']),
    extractFeatureText(features, 'postcode'),
    cleanValue(topFeature?.properties?.short_code)
  );

  return {
    area,
    district,
    zip,
  };
};

const fetchBigDataCloudAddress = async ({ lat, lng }: Coordinates) => {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  );

  if (!response.ok) return '';

  const data = (await response.json()) as BigDataCloudResponse;
  return formatAddress(
    data.locality || data.city || '',
    data.principalSubdivision || '',
    data.postcode || ''
  );
};

export async function resolveAddressFromCoordinates(lat: number, lng: number, mapboxToken?: string) {
  const fallbackText = formatAddress('', '', '');

  if (!mapboxToken) {
    try {
      const fallback = await fetchBigDataCloudAddress({ lat, lng });
      return fallback || fallbackText;
    } catch {
      return fallbackText;
    }
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?language=en&limit=10&types=address,neighborhood,locality,place,district,postcode,region&access_token=${mapboxToken}`
    );

    if (response.ok) {
      const data = (await response.json()) as { features?: MapboxFeature[] };
      const features = data.features || [];
      if (features.length) {
        const { area, district, zip } = extractMapboxAddress(features);
        const formatted = formatAddress(area, district, zip);
        if (formatted !== fallbackText) return formatted;
      }
    }
  } catch {
    // ignore Mapbox errors and use fallback below
  }

  try {
    const fallback = await fetchBigDataCloudAddress({ lat, lng });
    return fallback || fallbackText;
  } catch {
    return fallbackText;
  }
}
