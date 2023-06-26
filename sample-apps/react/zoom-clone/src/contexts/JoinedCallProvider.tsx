import { createContext, useContext, useState } from 'react';
import { Call, ChildrenOnly } from '@stream-io/video-react-sdk';

type JoinedCallContextValue = {
  joinedCall?: Call;
  setJoinedCall: (call?: Call) => void;
};

const JoinedCallContext = createContext<JoinedCallContextValue>({
  joinedCall: undefined,
  setJoinedCall: () => null,
});

export const JoinedCallProvider = ({ children }: ChildrenOnly) => {
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
