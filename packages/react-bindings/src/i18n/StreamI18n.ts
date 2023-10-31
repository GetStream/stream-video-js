import i18next from 'i18next';
import { mapToRegistry } from './utils';
import {
  TranslationLanguage,
  TranslationSheet,
  TranslationsMap,
  TranslatorFunction,
} from './types';

export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_NAMESPACE = 'stream-video';
const DEFAULT_CONFIG = {
  debug: false,
  currentLanguage: DEFAULT_LANGUAGE,
};

const DEFAULT_TRANSLATIONS_REGISTRY = mapToRegistry({}, DEFAULT_NAMESPACE);

export const defaultTranslationFunction = (key: string) => key;

export type StreamI18nConstructor = {
  /** Language into which the provided strings are translated */
  currentLanguage?: TranslationLanguage;
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
  /** Simple logger function */
  constructor(options: StreamI18nConstructor = {}) {
    const {
      debug = DEFAULT_CONFIG.debug,
      currentLanguage = DEFAULT_CONFIG.currentLanguage,
      translationsOverrides,
    } = options;

    this.i18nInstance = i18next.createInstance({
      debug,
      defaultNS: DEFAULT_NAMESPACE,
      fallbackLng: false,
      interpolation: { escapeValue: false },
      keySeparator: false,
      lng: currentLanguage,
      nsSeparator: false,
      parseMissingKeyHandler: (key) => {
        return key;
      },
      resources: DEFAULT_TRANSLATIONS_REGISTRY,
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
    this._checkIsInitialized();
    return this.i18nInstance.language;
  }

  get isInitialized() {
    return this.i18nInstance.isInitialized;
  }

  init = async () => {
    try {
      this.t = await this.i18nInstance.init();
    } catch (e) {
      console.error(`Failed to initialize translations: ${JSON.stringify(e)}`);
    }
    return this;
  };

  changeLanguage = async (
    language?: TranslationLanguage,
    onChange?: (language: TranslationLanguage) => void,
  ) => {
    if (!this._checkIsInitialized()) return;
    // i18next detects the language, if none provided, but it is better
    // to show this detection here explicitly
    const browserLanguage =
      typeof window !== 'undefined' && window.navigator
        ? window.navigator.language
        : undefined;
    await this.i18nInstance.changeLanguage(language || browserLanguage);
    onChange?.(this.currentLanguage);
  };

  registerTranslationsForLanguage = ({
    lng,
    translations,
  }: {
    lng: TranslationLanguage;
    translations: TranslationSheet;
  }) => {
    if (!this._checkIsInitialized()) return;
    this.i18nInstance.addResourceBundle(
      lng,
      DEFAULT_NAMESPACE,
      translations,
      true,
      true,
    );
  };

  private _checkIsInitialized = () => {
    if (!this.i18nInstance.isInitialized) {
      console.warn(
        'I18n instance is not initialized. Call yourStreamI18nInstance.init().',
      );
    }
    return this.i18nInstance.isInitialized;
  };
}
