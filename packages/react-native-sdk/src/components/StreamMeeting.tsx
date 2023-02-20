import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';
import { GetOrCreateCallRequest } from '@stream-io/video-client';

export type StreamMeetingProps = {
  callId: string;
  callType: string;
  input?: Omit<GetOrCreateCallRequest, 'members'>;
  onActiveCall?: () => void;
};

export const StreamMeeting = ({
  children,
  callId,
  callType,
  input,
  onActiveCall,
}: PropsWithChildren<StreamMeetingProps>) => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (!client) return;
    const initiateMeeting = async () => {
      await client.joinCall(callId, callType, input);
      InCallManager.start({ media: 'video' });
      InCallManager.setForceSpeakerphoneOn(true);
    };

    if (callId) {
      initiateMeeting().catch((e) => {
        console.error(
          `Failed to getOrCreateCall/joinCall`,
          callId,
          callType,
          e,
        );
      });
    }
  }, [callId, client, callType, input]);

  useEffect(() => {
    if (activeCall && onActiveCall) {
      onActiveCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall]);

  return <>{children}</>;
};
