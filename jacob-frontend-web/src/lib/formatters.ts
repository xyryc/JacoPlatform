export const formatRating = (value: unknown, fallback = '0.0') => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return numberValue.toFixed(1);
};
