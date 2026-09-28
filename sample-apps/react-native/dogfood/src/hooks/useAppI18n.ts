import { useMemo } from 'react';
import { useI18n } from '@stream-io/video-react-native-sdk';

type AppTranslate = (
  key: string,
  fallbackOrOptions?: string | Record<string, unknown>,
  options?: Record<string, unknown>,
) => string;

/**
 * `release-v1` counterpart of the `main` hook of the same name, so code backported from `main`
 * can import it unchanged.
 *
 * `main` calls `t(key, fallback, options)` with app-owned dotted keys. v1's `t` only takes
 * `(key, options)` and its catalog has none of those keys, so the fallback is forwarded as
 * i18next's `defaultValue`, and returned directly while the translator is still the
 * pre-init identity function.
 */
export const useAppI18n = () => {
  const i18n = useI18n();
  return useMemo(() => {
    const t: AppTranslate = (key, fallbackOrOptions, options) => {
      const fallback =
        typeof fallbackOrOptions === 'string' ? fallbackOrOptions : undefined;
      const params =
        typeof fallbackOrOptions === 'string' ? options : fallbackOrOptions;
      const result = i18n.t(
        key,
        fallback === undefined ? params : { ...params, defaultValue: fallback },
      );
      return result === key && fallback !== undefined ? fallback : result;
    };
    return { ...i18n, t };
  }, [i18n]);
};
