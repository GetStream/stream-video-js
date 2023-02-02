import { PropsWithChildren, useEffect } from 'react';
import { CreateCallInput, CoordinatorModels } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
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

  useEffect(() => {
    if (!client) return;
    const initiateMeeting = async () => {
      await client.joinCall(callId, callType, {
        ring: false,
        data: {
          team: 'team',
          created_by_id: currentUser,
          members:
            input?.members.map<CoordinatorModels.CallMemberRequest>(
              (member) => ({
                user_id: member.userId,
                role: member.role,
                user: {
                  id: member.userId,
                },
              }),
            ) ?? [],
        },
      });
    };

    initiateMeeting().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, currentUser, input]);

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
