import { createContext, PropsWithChildren, useContext, useState } from 'react';

import { Call } from '@stream-io/video-react-sdk';
import { noop } from '../utils/noop';

type JoinedCallContextValue = {
  joinedCall?: Call;
  setJoinedCall: (call?: Call) => void;
};

const JoinedCallContext = createContext<JoinedCallContextValue>({
  joinedCall: undefined,
  setJoinedCall: noop,
});

export const JoinedCallProvider = ({ children }: PropsWithChildren) => {
  const [joinedCall, setJoinedCall] = useState<Call>();

  return (
    <JoinedCallContext.Provider
      value={{
        joinedCall,
        setJoinedCall,
      }}
    >
      {children}
    </JoinedCallContext.Provider>
  );
};

export const useJoinedCall = () => useContext(JoinedCallContext);
