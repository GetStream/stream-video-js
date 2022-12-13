import { CreateCallInput, MemberInput } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { PropsWithChildren, useEffect } from 'react';
import { MediaDevicesProvider } from '../contexts/MediaDevicesContext';

export type StreamCallProps = {
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin?: boolean;
  members: MemberInput[];
  input?: CreateCallInput;
};

export const StreamCall = ({
  children,
  callId,
  callType,
  currentUser,
  autoJoin,
  input,
  members,
}: PropsWithChildren<StreamCallProps>) => {
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
          input: {
            ring: true,
            members,
          },
        });
        await call?.join();
      }
    };

    initiateMeeting().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, currentUser, autoJoin, input, members]);

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
