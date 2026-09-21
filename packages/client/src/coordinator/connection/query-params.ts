/**
 * Serializes query params the way the coordinator's request decoder reads them
 * (monolith/utils/request/decoder.go, setValueFromString):
 *
 *   - a slice of primitives is `strings.Split(val, ",")`, so primitive arrays
 *     are comma-joined;
 *   - a slice of structs (today only `[]*SortParamRequest`, e.g. `sort` on
 *     queryCallSessionParticipantStats) is `json.Unmarshal`ed, so arrays that
 *     contain objects are JSON;
 *   - maps and structs are JSON, `time.Time` is RFC3339, bools are "true".
 *
 * Axios' default serializer disagrees with all three: it emits `key[]=a&key[]=b`
 * for arrays and `key[field]=v` for objects, neither of which the decoder reads,
 * so a filter or sort sent that way is silently ignored by the server.
 *
 * This is installed once on the axios instance in `StreamClient`, so both the
 * generated client and the hand-written `streamClient.get/post/...` helpers
 * serialize identically.
 *
 * `null`/`undefined` values are dropped — the generated methods pass optional
 * query params as keys holding `undefined`.
 */
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
