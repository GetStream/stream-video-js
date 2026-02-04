import { createContext, useContext, useMemo, PropsWithChildren } from 'react';

export interface EmbeddedConfiguration {
  /**
   * Skip the lobby/device setup screen and auto-join.
   */
  skipLobby: boolean;
}

const defaultConfiguration: EmbeddedConfiguration = {
  skipLobby: false,
};

const ConfigurationContext =
  createContext<EmbeddedConfiguration>(defaultConfiguration);

export interface ConfigurationProviderProps {
  skipLobby?: boolean;
}

export const ConfigurationProvider = ({
  children,
  skipLobby = false,
}: PropsWithChildren<ConfigurationProviderProps>) => {
  const value = useMemo(() => ({ skipLobby }), [skipLobby]);

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
