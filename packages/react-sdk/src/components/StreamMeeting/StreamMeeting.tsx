import { PropsWithChildren, useEffect } from 'react';
import { JoinCallRequest } from '@stream-io/video-client';
import {
  StreamCallProvider,
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../core/contexts';

export type StreamMeetingProps = {
  callId: string;
  callType: string;
  input?: JoinCallRequest;
};

export const StreamMeeting = ({
  children,
  callId,
  callType,
  input,
}: PropsWithChildren<StreamMeetingProps>) => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (!client) return;
    const initiateMeeting = async () => {
      await client.call(callType, callId).join(input);
    };

    initiateMeeting().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, input]);

  return (
    <StreamCallProvider call={activeCall}>
      <MediaDevicesProvider enumerate>{children}</MediaDevicesProvider>
    </StreamCallProvider>
  );
};
