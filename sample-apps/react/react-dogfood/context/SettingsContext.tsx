import { createContext, PropsWithChildren, useContext } from 'react';
import { useLanguage } from '../hooks/useLanguage';

const defaultState: Settings = {};

export type Settings = {
  language?: string;
};

export type SettingsContextValue = {
  settings: Settings;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultState,
});

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const { language } = useLanguage();

  const settings: Settings = {
    language,
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
