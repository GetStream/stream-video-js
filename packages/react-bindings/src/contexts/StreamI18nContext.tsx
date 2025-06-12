import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  defaultTranslationFunction,
  StreamI18n,
  TranslationLanguage,
  TranslationsMap,
} from '../i18n';

type StreamI18nContextValue = {
  t: StreamI18n['t'];
  i18n?: StreamI18n;
};

const StreamI18nContext = createContext<StreamI18nContextValue>({
  t: defaultTranslationFunction,
});

type CreateI18nParams = {
  i18nInstance?: StreamI18n;
  language?: TranslationLanguage;
  fallbackLanguage?: TranslationLanguage;
  translationsOverrides?: TranslationsMap;
};

export type StreamI18nProviderProps = CreateI18nParams;

export const StreamI18nProvider = ({
  children,
  ...createI18nParams
}: PropsWithChildren<StreamI18nProviderProps>) => {
  const api = useCreateI18n(createI18nParams);
  return (
    <StreamI18nContext.Provider value={api}>
      {children}
    </StreamI18nContext.Provider>
  );
};

const useCreateI18n = ({
  i18nInstance,
  language,
  fallbackLanguage,
  translationsOverrides,
}: CreateI18nParams) => {
  const [i18n] = useState(
    () =>
      i18nInstance ||
      new StreamI18n({
        currentLanguage: language,
        fallbackLanguage,
        translationsOverrides,
      }),
  );
  const [t, setTranslationFn] = useState<StreamI18n['t']>(() => i18n.t);
  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.init().then(() => setTranslationFn(() => i18n.t));
    } else if (i18n.currentLanguage !== language) {
      i18n.changeLanguage(language).then(() => setTranslationFn(() => i18n.t));
    }
  }, [i18n, language]);

  return useMemo(() => ({ i18n, t }), [i18n, t]);
};

/**
 * A hook to get the i18n instance and translation function from the closest provider.
 *
 * Example usage:
 * const { t, i18n } = useI18n();
 * const message = t('hello_world');
 * console.log(message);
 */
export const useI18n = () => useContext(StreamI18nContext);
