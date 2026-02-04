import { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import type { LayoutOption } from '../types';

export interface EmbeddedConfiguration {
  /**
   * Skip the lobby/device setup screen and auto-join.
   */
  skipLobby: boolean;
  layout: LayoutOption;
}

const defaultConfiguration: EmbeddedConfiguration = {
  skipLobby: false,
  layout: 'SpeakerBottom',
};

const ConfigurationContext =
  createContext<EmbeddedConfiguration>(defaultConfiguration);

export interface ConfigurationProviderProps {
  skipLobby?: boolean;
  layout?: LayoutOption;
}

export const ConfigurationProvider = ({
  children,
  skipLobby = false,
  layout = 'SpeakerTop',
}: PropsWithChildren<ConfigurationProviderProps>) => {
  const value = useMemo(() => ({ skipLobby, layout }), [skipLobby, layout]);

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
