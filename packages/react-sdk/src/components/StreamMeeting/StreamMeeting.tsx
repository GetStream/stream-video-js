import { PropsWithChildren, useEffect } from 'react';
import { CreateCallInput } from '@stream-io/video-client';
import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

export type StreamMeetingProps = {
  callId: string;
  callType: string;
  currentUser: string;
  input?: CreateCallInput;
};

export const StreamMeeting = ({
  children,
  callId,
  callType,
  currentUser,
  input,
}: PropsWithChildren<StreamMeetingProps>) => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (!client) return;
    const initiateMeeting = async () => {
      await client.joinCall(callId, callType, {
        ring: false,
      });
    };

    initiateMeeting().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, currentUser, input]);

  return (
    <MediaDevicesProvider enumerate={!!activeCall}>
      {children}
    </MediaDevicesProvider>
  );
};
