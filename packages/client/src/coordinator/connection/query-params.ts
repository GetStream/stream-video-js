export const stringifyQueryParams = (params: Record<string, unknown>): string =>
  Object.entries(params)
    .flatMap(([key, value]) => {
      const serialized = serializeQueryValue(value);
      return serialized == null
        ? []
        : `${key}=${encodeURIComponent(serialized)}`;
    })
    .join('&');

const serializeQueryValue = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const hasObjects = value.some((v) => v !== null && typeof v === 'object');
    return hasObjects ? JSON.stringify(value) : value.join(',');
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
