import { useEffect, useState } from 'react';
import { TranslationLanguage } from '@stream-io/video-react-sdk';

const LANGUAGE_SETTINGS_KEY = '@pronto/lng-settings';

export const useLanguage = () => {
  const [language, setLanguage] = useState<string>(
    () =>
      getStoredLanguage() ||
      (typeof window !== 'undefined' ? window.navigator.language : 'en'),
  );

  useEffect(() => {
    storeLanguage(language);
  }, [language]);

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
