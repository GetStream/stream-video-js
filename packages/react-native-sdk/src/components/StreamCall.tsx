import { CreateCallInput } from '@stream-io/video-client';
import {
  useIncomingCalls,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import { MediaDevicesProvider } from '../contexts/MediaDevicesContext';

export type StreamCallProps = {
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin?: boolean;
  input?: CreateCallInput;
  onIncomingCall?: () => void;
  onOutgoingCall?: () => void;
};

export const StreamCall = ({
  children,
  callId,
  callType,
  currentUser,
  autoJoin,
  input,
  onIncomingCall,
  onOutgoingCall,
}: PropsWithChildren<StreamCallProps>) => {
  const client = useStreamVideoClient();
  const incomingCalls = useIncomingCalls();
  const outgoingCalls = useOutgoingCalls();

  useEffect(() => {
    if (!client) return;
    const initiateCall = async () => {
      client.createCall({
        id: callId,
        type: callType,
        input,
      });
    };

    initiateCall().catch((e) => {
      console.error(`Failed to createCall`, callId, callType, e);
    });
  }, [callId, client, callType, currentUser, autoJoin, input]);

  useEffect(() => {
    if (incomingCalls.length && onIncomingCall) {
      onIncomingCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCalls]);

  useEffect(() => {
    if (outgoingCalls.length && onOutgoingCall) {
      onOutgoingCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoingCalls]);

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
