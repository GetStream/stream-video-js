import {
  OwnCapability,
  StreamVideoClient,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import mockParticipant from './participant';

export const mockCall = (
  client: StreamVideoClient,
  participants?: StreamVideoParticipant[],
  ownCapabilities?: OwnCapability[],
) => {
  const call = client?.call('default', 'test-123');
  const _participants = participants || [mockParticipant()];
  call.state.setParticipantCount(_participants.length);
  call.state.setParticipants(_participants);
  call?.permissionsContext.setPermissions([
    OwnCapability.SEND_AUDIO,
    OwnCapability.SEND_VIDEO,
  ]);
  call.permissionsContext.setPermissions(ownCapabilities ?? []);
  call.state.setOwnCapabilities(ownCapabilities ?? []);

  // To handle the hang up call we need to mock the `leave` function
  call.leave = jest.fn();
  return call;
};
