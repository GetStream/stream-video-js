import i18next from 'i18next';
import {
  TranslationLanguage,
  TranslationsMap,
  TranslationsRegistry,
  TranslatorFunction,
} from './types';

const mapToRegistry = (translationsMap: TranslationsMap, namespace: string) =>
  Object.entries(translationsMap).reduce((acc, [lng, translations]) => {
    acc[lng] = { [namespace]: translations };
    return acc;
  }, {} as TranslationsRegistry);

export const defaultTranslationFunction = (key: string) => key;

export type StreamI18nConstructor = {
  /** Language into which the provided strings are translated */
  currentLanguage?: TranslationLanguage;
  /** Fallback language which will be used if no translation is found for current language */
  fallbackLanguage?: TranslationLanguage;
  /** Logs info level to console output. Helps find issues with loading not working. */
  debug?: boolean;
  /** Custom translations that will be merged with the defaults provided by the library. */
  translationsOverrides?: TranslationsMap;
};

export class StreamI18n {
  /** Exposed i18n instance from the i18next library */
  i18nInstance;
  /** Translator function that converts the provided string into its equivalent in the current language. */
  t: TranslatorFunction = defaultTranslationFunction;

  constructor({
    debug = false,
    currentLanguage = 'en',
    fallbackLanguage,
    translationsOverrides = { en: {} },
  }: StreamI18nConstructor = {}) {
    const ns = 'stream-video';
    this.i18nInstance = i18next.createInstance({
      debug,
      defaultNS: ns,
      fallbackLng: fallbackLanguage,
      interpolation: { escapeValue: false },
      keySeparator: false,
      lng: currentLanguage,
      nsSeparator: false,
      parseMissingKeyHandler: defaultTranslationFunction,
      resources: mapToRegistry(translationsOverrides, ns),
    });
  }

  get currentLanguage() {
    return this.i18nInstance.language;
  }

  get isInitialized() {
    return this.i18nInstance.isInitialized;
  }

  init = async () => {
    this.t = await this.i18nInstance.init();
    return this.t;
  };

  changeLanguage = async (language?: TranslationLanguage) => {
    this.t = await this.i18nInstance.changeLanguage(language);
    return this.t;
  };
}
