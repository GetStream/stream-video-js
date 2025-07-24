import {
  type CallRecordingReadyEvent,
  StreamClient,
} from '@stream-io/node-sdk';

const basicAuth = `Basic ${btoa(
  `${process.env.GONG_ACCESS_KEY}:${process.env.GONG_SECRET}`,
)}`;

export async function uploadCallRecording(
  client: StreamClient,
  event: CallRecordingReadyEvent,
) {
  const startTime = event.call_recording.start_time.toISOString();
  const recordingId = `${event.call_recording.session_id}-${startTime}`;
  const [callType, callId] = event.call_cid.split(':');
  const call = await client.video.getCall({ type: callType, id: callId });
  const primaryMember = call.members.find((member) => member.role === 'stream');

  if (!primaryMember) {
    console.warn('Noone from stream was in call');
    return;
  }

  const primaryUser = await lookupUserByEmail(primaryMember.user.custom.email);

  if (!primaryUser) {
    console.warn(
      `Primary user ${primaryMember.user.custom.email} not found in Gong`,
    );
    return;
  }

  const res = await fetch(`${process.env.GONG_BASE_URL}/v2/calls`, {
    method: 'POST',
    body: JSON.stringify({
      clientUniqueId: recordingId,
      actualStart: startTime,
      primaryUser,
      parties: call.members.map((member) =>
        member === primaryMember
          ? {
              userId: primaryUser,
              name: member.user.name,
              emailAddress: member.user.custom.email,
            }
          : { name: member.user.name },
      ),
      direction: 'Outbound',
    }),
    headers: {
      Authorization: basicAuth,
      'Content-Type': 'application/json',
    },
  });

  console.log(await res.json());
}

const lookupUserByEmail = (() => {
  const ttl = 3600;
  let cache: Record<string, string> | null = null;
  let lastRefreshAt = -1;

  async function lookup(email: string) {
    if (
      !cache ||
      lastRefreshAt < 0 ||
      (Date.now() - lastRefreshAt) / 1000 > ttl
    ) {
      await refresh().catch(() => {
        console.error('Failed to update Gong user cache');
      });
    }

    return cache?.[email] ?? null;
  }

  async function refresh() {
    const nextCache: Record<string, string> = {};
    let cursor = '';

    while (true) {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      const res = await fetch(
        `${process.env.GONG_BASE_URL}/v2/users?${params}`,
        { headers: { Authorization: basicAuth } },
      );
      const data = await res.json();

      for (const user of data.users) {
        nextCache[user.emailAddress] = user.id;
      }

      if (!data.records.cursor) {
        break;
      }

      cursor = data.records.cursor;
    }

    cache = nextCache;
    lastRefreshAt = Date.now();
  }

  return lookup;
})();
