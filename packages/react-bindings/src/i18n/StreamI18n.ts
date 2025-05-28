import i18next from 'i18next';
import {
  TranslationLanguage,
  TranslationSheet,
  TranslationsMap,
  TranslatorFunction,
} from './types';

const DEFAULT_NAMESPACE = 'stream-video';

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
    translationsOverrides,
  }: StreamI18nConstructor = {}) {
    this.i18nInstance = i18next.createInstance({
      debug,
      defaultNS: DEFAULT_NAMESPACE,
      fallbackLng: fallbackLanguage,
      interpolation: { escapeValue: false },
      keySeparator: false,
      lng: currentLanguage,
      nsSeparator: false,
      parseMissingKeyHandler: (key) => key,
    });

    if (translationsOverrides) {
      this.i18nInstance.on('initialized', () => {
        Object.entries(translationsOverrides).forEach(([lng, translations]) => {
          this.registerTranslationsForLanguage({ lng, translations });
        });
      });
    }
  }

  get currentLanguage() {
    return this.i18nInstance.language;
  }

  get isInitialized() {
    return this.i18nInstance.isInitialized;
  }

  init = async () => {
    this.t = await this.i18nInstance.init();
  };

  changeLanguage = async (language?: TranslationLanguage) => {
    // i18next detects the language, if none provided, but it is better
    // to show this detection here explicitly
    const browserLanguage =
      typeof window !== 'undefined' && window.navigator
        ? window.navigator.language
        : undefined;
    await this.i18nInstance.changeLanguage(language || browserLanguage);
  };

  registerTranslationsForLanguage = ({
    lng,
    translations,
  }: {
    lng: TranslationLanguage;
    translations: TranslationSheet;
  }) => {
    this.i18nInstance.addResourceBundle(
      lng,
      DEFAULT_NAMESPACE,
      translations,
      true,
      true,
    );
  };
}
