import { createContext, PropsWithChildren, useContext } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import {
  DeviceSelectionPreference,
  useDeviceSelectionPreference,
} from '../hooks/useDeviceSelectionPreference';

const defaultState: Settings = {
  deviceSelectionPreference: 'recent',
  setDeviceSelectionPreference: () => {},
};

export type Settings = {
  language?: string;
  fallbackLanguage?: string;
  setLanguage?: (value: string) => void;
  deviceSelectionPreference: DeviceSelectionPreference;
  setDeviceSelectionPreference: (value: DeviceSelectionPreference) => void;
};

export type SettingsContextValue = {
  settings: Settings;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultState,
});

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const { language, setLanguage, fallbackLanguage } = useLanguage();
  const { deviceSelectionPreference, setDeviceSelectionPreference } =
    useDeviceSelectionPreference();

  const settings: Settings = {
    language,
    fallbackLanguage,
    setLanguage,
    deviceSelectionPreference,
    setDeviceSelectionPreference,
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
