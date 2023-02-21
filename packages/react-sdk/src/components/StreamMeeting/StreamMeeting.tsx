import { PropsWithChildren, useEffect } from 'react';
import { CreateCallInput } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';

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

  useEffect(() => {
    if (!client) return;
    const initiateMeeting = async () => {
      const descriptors = { id: callId, type: callType };
      const callMetadata = await client.getOrCreateCall({
        ...descriptors,
        input,
      });
      if (
        callMetadata?.call?.createdByUserId === currentUser ||
        client.callConfig.joinCallInstantly
      ) {
        await client.joinCall({
          ...descriptors,
          // FIXME: OL optional, but it is marked as required in proto
          datacenterId: '',
        });
      }
    };

    initiateMeeting().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, currentUser, input]);

  return <>{children}</>;
};
