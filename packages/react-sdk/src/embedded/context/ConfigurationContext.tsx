import { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import type { LayoutOption, ConfigurationProviderProps } from '../types';

export type { ConfigurationProviderProps } from '../types';

export interface EmbeddedConfiguration {
  /**
   * Skip the lobby/device setup screen and auto-join.
   */
  skipLobby: boolean;
  layout: LayoutOption;
  onError?: (error: Error) => void;
}

const defaultConfiguration: EmbeddedConfiguration = {
  skipLobby: false,
  layout: 'PaginatedGrid',
  onError: undefined,
};

const ConfigurationContext =
  createContext<EmbeddedConfiguration>(defaultConfiguration);

export const ConfigurationProvider = ({
  children,
  skipLobby = false,
  layout = 'SpeakerTop',
  onError,
}: PropsWithChildren<ConfigurationProviderProps>) => {
  const value = useMemo(
    () => ({ skipLobby, layout, onError }),
    [skipLobby, layout, onError],
  );

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
