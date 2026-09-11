/**
 * The generated token files leave same-group references unresolved, emitted as
 * `"$otherTokenName"` string values (cross-group references are already emitted
 * as expressions). This resolves those references once, at module load.
 */
const REFERENCE_PREFIX = '$';

const isReference = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith(REFERENCE_PREFIX);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Follows a `$name` reference chain within `group` until it reaches a concrete
 * value. Unresolvable and cyclic references are returned as-is, so a broken
 * token shows up as a visible `"$name"` string instead of `undefined`.
 */
const dereference = (
  reference: string,
  group: Record<string, unknown>,
): unknown => {
  const seen = new Set<string>();
  let current: unknown = reference;

  while (isReference(current)) {
    const key = current.slice(REFERENCE_PREFIX.length);
    if (seen.has(key) || !(key in group)) return current;
    seen.add(key);
    current = group[key];
  }

  return current;
};

const resolveValue = (
  value: unknown,
  group: Record<string, unknown>,
): unknown => {
  if (isReference(value)) return dereference(value, group);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        resolveValue(nested, group),
      ]),
    );
  }
  return value;
};

/**
 * Returns a copy of `group` with every `$name` self-reference replaced by the
 * value it points at.
 */
export const resolveTokenGroup = <T extends object>(group: T): T =>
  Object.fromEntries(
    Object.entries(group).map(([key, value]) => [
      key,
      resolveValue(value, group as Record<string, unknown>),
    ]),
  ) as T;
