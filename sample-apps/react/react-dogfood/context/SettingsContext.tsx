import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { SettingsDialog } from '../components';
import { useLanguage } from '../hooks/useLanguage';

const noop = () => null;
const defaultState: Settings = {};

export type Settings = {
  language?: string;
};

export type SettingsContextValue = {
  setOpen: (open: boolean) => void;
  settings: Settings;
};

const SettingsContext = createContext<SettingsContextValue>({
  setOpen: noop,
  settings: defaultState,
});

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const [isOpen, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const settings: Settings = {
    language,
  };

  return (
    <SettingsContext.Provider
      value={{
        setOpen,
        settings,
      }}
    >
      <SettingsDialog
        open={isOpen}
        onClose={() => setOpen(false)}
        controller={{
          setLanguage,
        }}
        settings={settings}
      />
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
