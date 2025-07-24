import {
  CallSessionParticipantJoinedEvent,
  StreamClient,
} from '@stream-io/node-sdk';

export async function saveParticipantAsCallMember(
  client: StreamClient,
  event: CallSessionParticipantJoinedEvent,
) {
  const [callType, callId] = event.call_cid.split(':');
  const call = client.video.call(callType, callId);
  await call.updateCallMembers({
    update_members: [{ user_id: event.participant.user.id }],
  });
}
