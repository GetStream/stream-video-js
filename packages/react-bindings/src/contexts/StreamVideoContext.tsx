import { createContext, PropsWithChildren, useContext } from 'react';
import { StreamVideoClient } from '@stream-io/video-client';

const StreamVideoContext = createContext<StreamVideoClient | undefined>(
  undefined,
);

/**
 * The props for the StreamVideoProvider component.
 */
export type StreamVideoProviderProps = {
  /**
   * The client instance to provide to the component tree.
   */
  client: StreamVideoClient;
};

/**
 * StreamVideoProvider is a provider component which should be used to wrap the entire
 * application. It provides the client object to all children components.
 *
 * Translations are deliberately *not* mounted here anymore. The translation key catalog is
 * generated per-SDK from that SDK's own `t()` call sites, so the i18n runtime and the bundled
 * copy live downstream of this package — in `@stream-io/video-react-sdk` and
 * `@stream-io/video-react-native-sdk`, each of which mounts its own translation provider from
 * its `src/i18n` module. This package has no `t()` call sites, and therefore no catalog to
 * provide.
 */
export const StreamVideoProvider = ({
  children,
  client,
}: PropsWithChildren<StreamVideoProviderProps>) => {
  return (
    <StreamVideoContext.Provider value={client}>
      {children}
    </StreamVideoContext.Provider>
  );
};

/**
 * Hook to access the nearest StreamVideo client instance.
 */
export const useStreamVideoClient = () => {
  return useContext(StreamVideoContext);
};
