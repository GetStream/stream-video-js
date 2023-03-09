import { createContext, PropsWithChildren, useContext } from 'react';
import { Call } from '@stream-io/video-client';

const StreamCallContext = createContext<Call | undefined>(undefined);

export interface StreamCallProviderProps {
  call: Call;
}

// TODO OL: naming
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

// TODO OL: naming
export const useCurrentCall = () => {
  return useContext(StreamCallContext);
};
