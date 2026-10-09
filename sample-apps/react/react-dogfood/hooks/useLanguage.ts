import { useEffect, useState } from 'react';

import { appTranslations } from '../translations';

const LANGUAGE_SETTINGS_KEY = '@pronto/lng-settings';

const DEFAULT_LANGUAGE = 'en';

/**
 * Reduces a BCP 47 tag to the base subtag the dictionaries are keyed by, then falls back to English
 * for anything this app has no dictionary for.
 *
 * `window.navigator.language` yields region tags — `en-US`, `de-DE` — which never matched the bare
 * `en` / `de` / `es` keys. The prop that was supposed to catch that never did, and it is gone from
 * `<StreamVideo>` now; with `fallbackLng` off in the shared runtime an unregistered language
 * renders the inline English for SDK and app prose but raw dotted keys for the `language.*` block,
 * which has no inline default. Normalizing here is what keeps that from happening.
 */
const normalizeLanguage = (tag: string | null | undefined) => {
  const base = tag?.split('-')[0]?.toLowerCase();
  return base && base in appTranslations ? base : DEFAULT_LANGUAGE;
};

export const useLanguage = () => {
  const [language, setLanguage] = useState<string>(() =>
    normalizeLanguage(
      getStoredLanguage() ??
        (typeof window !== 'undefined' ? window.navigator.language : undefined),
    ),
  );

  useEffect(() => {
    storeLanguage(language);
  }, [language]);

  return {
    language,
    setLanguage,
  };
};

const storeLanguage = (lng: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANGUAGE_SETTINGS_KEY, lng);
  } catch (e) {
    console.warn(`Language couldn't be stored`, e);
  }
};

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return;
  try {
    return window.localStorage.getItem(LANGUAGE_SETTINGS_KEY);
  } catch (e) {
    console.warn(`Language couldn't be retrieved`, e);
  }
};
