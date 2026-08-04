export const KM_PER_MILE = 1.60934;

const roundTo = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const kmToMiles = (km: number | null | undefined, digits = 1) => {
  const numericKm = Number(km);
  if (!Number.isFinite(numericKm)) return 0;
  return roundTo(numericKm / KM_PER_MILE, digits);
};

export const milesToKm = (miles: number | null | undefined, digits = 0) => {
  const numericMiles = Number(miles);
  if (!Number.isFinite(numericMiles)) return 0;
  return roundTo(numericMiles * KM_PER_MILE, digits);
};

export const formatMilesFromKm = (km: number | null | undefined, digits = 1) =>
  `${kmToMiles(km, digits).toFixed(digits)} mi`;
