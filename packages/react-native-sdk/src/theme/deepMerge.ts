/**
 * Recursively marks every property of `T` as optional.
 *
 * The `extends object` guard is required, not cosmetic: `Theme` carries a
 * `[component: string]: any` index signature, which the mapped type inherits.
 * Without the guard that index signature becomes `DeepPartial<any>`, an
 * all-object type that no primitive leaf can satisfy, and every theme override
 * fails to typecheck. Guarding short-circuits `any` back to `any`.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Deep-merges `source` onto `target` without modifying either.
 *
 * Because the result shares structure with `target`, callers that hand the
 * result to someone who may mutate it should clone first. `mergeThemes` does
 * exactly that, so the `Theme` a consumer receives is wholly its own.
 *
 * `undefined` values are skipped (so a partial override never blanks a value),
 * `null` is assigned, and arrays replace rather than merge - `isObject`
 * excludes them deliberately.
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>,
): T => {
  let result: T | undefined;

  for (const key in source) {
    const sourceValue = source[key];
    if (sourceValue === undefined) continue;

    const targetValue = target[key as keyof T];
    const nextValue =
      isObject(sourceValue) && isObject(targetValue)
        ? deepMerge(
            targetValue,
            sourceValue as DeepPartial<Record<string, unknown>>,
          )
        : sourceValue;

    if (nextValue === targetValue) continue;

    result ??= { ...target };
    result[key as keyof T] = nextValue as T[keyof T];
  }

  return result ?? target;
};
