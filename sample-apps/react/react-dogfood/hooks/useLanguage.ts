import { useCallback, useEffect, useState } from 'react';
import { TranslationLanguage } from '@stream-io/video-react-sdk';

const LANGUAGE_SETTINGS_KEY = '@pronto/lng-settings';

export const useLanguage = () => {
  const [language, _setLanguage] = useState<string | undefined>();

  const setLanguage = useCallback((lng: TranslationLanguage) => {
    _setLanguage(lng);
    storeLanguage(lng);
  }, []);

  useEffect(() => {
    setLanguage(getStoredLanguage() || window.navigator.language);
  }, [setLanguage]);

  return {
    language,
    fallbackLanguage: 'en',
    setLanguage,
  };
};

const storeLanguage = (lng: TranslationLanguage) => {
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
