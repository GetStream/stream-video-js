import { createContext, PropsWithChildren, useContext } from 'react';
import { Call } from '@stream-io/video-client';

const StreamCallContext = createContext<Call | undefined>(undefined);

/**
 * The props for the StreamCallProvider component.
 */
export interface StreamCallProviderProps {
  call?: Call;
}

/**
 * A provider for the call object.
 */
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

/**
 * A hook to get the call object from the closest provider.
 */
export const useCall = () => {
  return useContext(StreamCallContext);
};
