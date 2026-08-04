export const DELIVERY_TIME_UNITS = ['Hours', 'Days', 'Weeks'] as const;

export type DeliveryTimeUnit = (typeof DELIVERY_TIME_UNITS)[number];

export const normalizeDeliveryTimeUnit = (unit?: string | null): DeliveryTimeUnit => {
  return DELIVERY_TIME_UNITS.includes(unit as DeliveryTimeUnit) ? (unit as DeliveryTimeUnit) : 'Days';
};

export const formatDeliveryTime = (value?: string | number | null, unit?: string | null) => {
  const time = String(value || '').trim();
  if (!time) return 'Flexible';

  if (/[a-z]/i.test(time)) return time;
  return `${time} ${normalizeDeliveryTimeUnit(unit)}`;
};
