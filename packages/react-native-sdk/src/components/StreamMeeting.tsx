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
  currentUser: string;
  autoJoin?: boolean;
  input?: Omit<GetOrCreateCallRequest, 'members'>;
  onActiveCall?: () => void;
};

export const StreamMeeting = ({
  children,
  callId,
  callType,
  currentUser,
  autoJoin,
  input,
  onActiveCall,
}: PropsWithChildren<StreamMeetingProps>) => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (!client) return;
    const initiateMeeting = async () => {
      const callMetadata = await client.getOrCreateCall(
        callId,
        callType,
        input,
      );
      if (callMetadata?.call?.created_by.id === currentUser || autoJoin) {
        await client.joinCall(callId, callType);
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
      }
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
  }, [callId, client, callType, currentUser, autoJoin, input]);

  useEffect(() => {
    if (activeCall && onActiveCall) {
      onActiveCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall]);

  return <>{children}</>;
};
