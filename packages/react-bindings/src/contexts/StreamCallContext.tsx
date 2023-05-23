import { createContext, PropsWithChildren, useContext } from 'react';
import { Call } from '@stream-io/video-client';

const StreamCallContext = createContext<Call | undefined>(undefined);

/**
 *
 * We don't expose types in our docs site but we should still add doc comments
 * @internal
 */
export interface StreamCallProviderProps {
  call?: Call;
}

/**
 *
 * @param props
 * @returns
 *
 * @category Call State
 *
 * @react If you're using the React SDK we recommend using the `StreamCall` component that wraps the `StreamCallProvider`. You only need to use the `StreamCallProvider` for advanced use-cases.
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
 *
 * @returns
 *
 * @category Call State
 */
export const useCall = () => {
  return useContext(StreamCallContext);
};
