import {
  OwnCapability,
  StreamVideoClient,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import mockParticipant from './participant';

export const mockCall = (
  client: StreamVideoClient,
  participants?: StreamVideoParticipant[],
) => {
  const call = client?.call('default', 'test-123');
  const _participants = participants || [mockParticipant()];
  call.state.setParticipantCount(_participants.length);
  call.state.setParticipants(_participants);
  call?.permissionsContext.setPermissions([
    OwnCapability.SEND_AUDIO,
    OwnCapability.SEND_VIDEO,
  ]);
  return call;
};
