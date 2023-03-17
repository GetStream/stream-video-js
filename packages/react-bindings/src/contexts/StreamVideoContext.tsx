import { createContext, PropsWithChildren, useContext } from 'react';
import { StreamVideoClient } from '@stream-io/video-client';

const StreamVideoContext = createContext<StreamVideoClient | undefined>(
  undefined,
);

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export interface StreamVideoProps {
  client: StreamVideoClient;
}

/**
 *
 * @category Client State
 */
export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  const { children, client } = props;
  return (
    <StreamVideoContext.Provider value={client}>
      {children}
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
