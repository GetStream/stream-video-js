import { type CallSessionEndedEvent, StreamClient } from '@stream-io/node-sdk';

export async function deleteCallChatChannel(
  client: StreamClient,
  event: CallSessionEndedEvent,
) {
  const callIdFromCid = event.call_cid?.split(':')[1];
  const callId = event.call?.id ?? callIdFromCid;
  if (!callId) return;

  const type = 'videocall';
  try {
    await client.chat.deleteChannel({ type, id: callId, hard_delete: true });
    console.log(`Hard-deleted chat channel ${type}:${callId}`);
  } catch (err) {
    if (isChannelNotFound(err)) {
      console.log(`Chat channel ${type}:${callId} already gone, skipping`);
      return;
    }
    throw err;
  }
}

function isChannelNotFound(err: unknown): boolean {
  const CHANNEL_NOT_FOUND_CODE = 16;
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === CHANNEL_NOT_FOUND_CODE
  );
}
