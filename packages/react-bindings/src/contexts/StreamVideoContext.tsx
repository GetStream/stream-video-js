import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { StreamVideoClient } from '@stream-io/video-client';
import {
  StreamI18nProvider,
  StreamI18nProviderProps,
} from './StreamI18nContext';

const StreamVideoContext = createContext<StreamVideoClient | undefined>(
  undefined,
);

/**
 * Exclude types from documentation site, but we should still add doc comments
 * @internal
 */
export type StreamVideoProps = StreamI18nProviderProps & {
  client: StreamVideoClient;
};

/**
 * StreamVideo is a provider component which should be used to wrap the entire application.
 * It provides the client object to all children components and initializes the i18n instance.
 *  @param PropsWithChildren<StreamVideoProps>
 *  @category Client State
 */
export const StreamVideo = ({
  children,
  client,
  i18nInstance,
  language,
  translationsOverrides,
}: PropsWithChildren<StreamVideoProps>) => {
  const prevClient = useRef<StreamVideoClient | undefined>(undefined);

  useEffect(() => {
    if (client.user) {
      client
        .connectUser()
        .catch((error) =>
          console.error('Failed to establish connection', error),
        );

      prevClient.current = client;
    }
    return () => {
      prevClient.current
        ?.disconnectUser()
        .catch((error) => console.error(`Failed to disconnect`, error));
    };
  }, [client]);

  return (
    <StreamVideoContext.Provider value={client}>
      <StreamI18nProvider
        i18nInstance={i18nInstance}
        language={language}
        translationsOverrides={translationsOverrides}
      >
        {children}
      </StreamI18nProvider>
    </StreamVideoContext.Provider>
  );
};

/**
 *
 * @returns
 *
 * @category Client State
 */
export const useStreamVideoClient = () => {
  return useContext(StreamVideoContext);
};
