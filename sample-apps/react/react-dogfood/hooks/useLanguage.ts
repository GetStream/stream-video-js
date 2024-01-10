import { useCallback, useEffect, useState } from 'react';
import { TranslationLanguage } from '@stream-io/video-react-sdk';

const LANGUAGE_SETTINGS_KEY = '@pronto/lng-settings';

export const useLanguage = () => {
  const [language, _setLanguage] = useState<string | undefined>();

  const setLanguage = useCallback((lng: TranslationLanguage) => {
    if (typeof window === 'undefined') return;
    _setLanguage(lng);
    window.localStorage.setItem(LANGUAGE_SETTINGS_KEY, lng);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLanguage(
      window.localStorage.getItem(LANGUAGE_SETTINGS_KEY) ||
        window.navigator.language,
    );
  }, [setLanguage]);

  return {
    language,
    fallbackLanguage: 'en',
    setLanguage,
  };
};
