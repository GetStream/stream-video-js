import { CreateCallInput } from '@stream-io/video-client';
import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';

export type StreamMeetingProps = {
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin?: boolean;
  input?: CreateCallInput;
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
      const descriptors = { id: callId, type: callType };
      const callMetadata = await client.getOrCreateCall({
        ...descriptors,
        input,
      });
      if (callMetadata?.call?.createdByUserId === currentUser || autoJoin) {
        const call = await client.joinCall({
          ...descriptors,
          // FIXME: OL optional, but it is marked as required in proto
          datacenterId: '',
        });
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
        await call?.join();
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
