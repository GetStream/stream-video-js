import { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import type { LayoutOption, ConfigurationProviderProps } from '../types';

export type { ConfigurationProviderProps } from '../types';

export interface EmbeddedConfiguration {
  layout: LayoutOption;
  onError?: (error: Error) => void;
}

const defaultConfiguration: EmbeddedConfiguration = {
  layout: 'SpeakerBottom',
  onError: undefined,
};

const ConfigurationContext =
  createContext<EmbeddedConfiguration>(defaultConfiguration);

export const ConfigurationProvider = ({
  children,
  layout = 'SpeakerTop',
  onError,
}: PropsWithChildren<ConfigurationProviderProps>) => {
  const value = useMemo(() => ({ layout, onError }), [layout, onError]);

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};

/**
 * Hook to access embedded configuration settings.
 */
export const useEmbeddedConfiguration = () => {
  return useContext(ConfigurationContext);
};
