import { createContext, useContext, useState } from 'react';

import { Call, ChildrenOnly } from '@stream-io/video-react-sdk';
import { noop } from '../utils/noop';

export const CALL_TYPE = 'audio_room';

type CallContext = {
  joinedCall?: Call;
  setJoinedCall: (call?: Call) => void;
};

const CallsContext = createContext<CallContext>({
  joinedCall: undefined,
  setJoinedCall: noop,
});

export const JoinedCallProvider = ({ children }: ChildrenOnly) => {
  const [joinedCall, setJoinedCall] = useState<Call>();

  return (
    <CallsContext.Provider
      value={{
        joinedCall,
        setJoinedCall,
      }}
    >
      {children}
    </CallsContext.Provider>
  );
};

export const useJoinedCall = () => useContext(CallsContext);
