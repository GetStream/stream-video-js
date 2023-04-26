import { createContext, PropsWithChildren, useContext } from 'react';
import { StreamVideoClient } from '@stream-io/video-client';
import {
  StreamI18nProvider,
  StreamI18nProviderProps,
} from './StreamI18nContext';

const StreamVideoContext = createContext<StreamVideoClient | undefined>(
  undefined,
);

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type StreamVideoProps = StreamI18nProviderProps & {
  client: StreamVideoClient;
};

/**
 *
 * @category Client State
 */
export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  const { children, client, i18nInstance, language, translationsOverrides } =
    props;
  console.log('CAAaaaAAAASSAAAAAAAAAAAAAAAAA');
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
