import { createContext, PropsWithChildren, useContext } from 'react';
import { StreamVideoClient } from '@stream-io/video-client';

const StreamVideoContext = createContext<StreamVideoClient | undefined>(
  undefined,
);

export interface StreamVideoProps {
  client: StreamVideoClient | undefined;
}

export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  const { children, client } = props;
  return (
    <StreamVideoContext.Provider value={client}>
      {children}
    </StreamVideoContext.Provider>
  );
};

export const useStreamVideoClient = () => {
  return useContext(StreamVideoContext);
};
