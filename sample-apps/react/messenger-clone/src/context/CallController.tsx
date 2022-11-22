import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { CreateCallInput } from '@stream-io/video-client';

import { noop } from '../utils/noop';

export type CallType = 'default' | string;

export type CallConfig = {
  id: string;
  type: CallType;
  input: CreateCallInput;
};

type CallControllerContextValue = {
  call?: CallConfig;
  createCall: (call: CallConfig) => void;
  joinCall: (id: string) => void;
};

const CallControllerContext = createContext<CallControllerContextValue>({
  createCall: noop,
  joinCall: noop,
});

export const CallController = ({ children }: { children: ReactNode }) => {
  const [callId, setCallId] = useState<string | undefined>(undefined);
  const [callType, setCallType] = useState<string>('default');
  const [callInput, setCallInput] = useState<CreateCallInput | undefined>(
    undefined,
  );

  const createCall = useCallback(async (call: CallConfig) => {
    setCallId(call.id);
    setCallType(call.type || 'default');
    setCallInput(call.input);
  }, []);

  const joinCall = useCallback((id: string) => {
    setCallId(id);
  }, []);

  return (
    <CallControllerContext.Provider
      value={{
        call: {
          id: callId,
          type: callType,
          input: callInput,
        },
        createCall,
        joinCall,
      }}
    >
      {children}
    </CallControllerContext.Provider>
  );
};

export const useCallController = () => useContext(CallControllerContext);
