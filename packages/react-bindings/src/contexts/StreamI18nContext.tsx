import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  defaultTranslationFunction,
  StreamI18n,
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
  language?: string;
  translationsOverrides?: TranslationsMap;
};

export type StreamI18nProviderProps = CreateI18nParams;

export const StreamI18nProvider = ({
  children,
  ...createI18nParams
}: PropsWithChildren<StreamI18nProviderProps>) => {
  const { i18n, t } = useCreateI18n(createI18nParams);

  return (
    <StreamI18nContext.Provider value={{ t, i18n }}>
      {children}
    </StreamI18nContext.Provider>
  );
};

export const useCreateI18n = ({
  i18nInstance,
  language,
  translationsOverrides,
}: CreateI18nParams) => {
  const [i18n] = useState(
    () =>
      i18nInstance ||
      new StreamI18n({ currentLanguage: language, translationsOverrides }),
  );
  const [t, setTranslationFn] = useState<StreamI18n['t']>(
    () => defaultTranslationFunction,
  );

  useEffect(() => {
    const { isInitialized } = i18n;
    if (!isInitialized) {
      i18n.init().then((_i18n) => setTranslationFn(() => _i18n.i18nInstance.t));
      return;
    }
    if (language && i18n?.currentLanguage !== language) {
      i18n.changeLanguage(language).catch((err) => {
        console.log('Error while changing language', err);
      });
    }
  }, [i18n, i18nInstance, language, translationsOverrides]);

  return { i18n, t };
};

export const useI18n = () => useContext(StreamI18nContext);
