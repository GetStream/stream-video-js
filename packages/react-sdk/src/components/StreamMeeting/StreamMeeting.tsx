import { PropsWithChildren, useEffect } from 'react';
import { CreateCallInput } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import {
  LocalMediaStreamsContextProvider,
  MediaDevicesProvider,
} from '../../contexts';

export type StreamMeetingProps = {
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin?: boolean;
  input?: CreateCallInput;
};

export const StreamMeeting = ({
  children,
  callId,
  callType,
  currentUser,
  autoJoin,
  input,
}: PropsWithChildren<StreamMeetingProps>) => {
  const client = useStreamVideoClient();

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
        await call?.join();
      }
    };

    initiateMeeting().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, currentUser, autoJoin, input]);

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
