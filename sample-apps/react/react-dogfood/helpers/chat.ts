import { type CallSessionEndedEvent, StreamClient } from '@stream-io/node-sdk';

export async function deleteCallChatChannel(
  client: StreamClient,
  event: CallSessionEndedEvent,
) {
  const id = event.call?.id ?? event.call_cid?.split(':')[1];
  if (!id) return;

  const type = 'videocall';
  try {
    await client.chat.deleteChannel({ type, id, hard_delete: true });
    console.log(`Hard-deleted chat channel ${type}:${id}`);
  } catch (err) {
    if (isChannelNotFound(err)) {
      console.log(`Chat channel ${type}:${id} already gone, skipping`);
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
