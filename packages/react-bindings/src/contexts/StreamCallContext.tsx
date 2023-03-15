import { createContext, PropsWithChildren, useContext } from 'react';
import { Call } from '@stream-io/video-client';

const StreamCallContext = createContext<Call | undefined>(undefined);

export interface StreamCallProviderProps {
  call?: Call;
}

export const StreamCallProvider = (
  props: PropsWithChildren<StreamCallProviderProps>,
) => {
  const { call, children } = props;
  return (
    <StreamCallContext.Provider value={call}>
      {children}
    </StreamCallContext.Provider>
  );
};

export const useCall = () => {
  return useContext(StreamCallContext);
};
