import { PropsWithChildren, useEffect } from 'react';
import { GetOrCreateCallRequest } from '@stream-io/video-client';
import {
  StreamCallProvider,
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

export type StreamMeetingProps = {
  callId: string;
  callType: string;
  input?: Omit<GetOrCreateCallRequest, 'members'>;
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
      await client.joinCall(callId, callType, input);
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
