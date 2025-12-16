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
  const startTime = new Date(event.call_recording.start_time).toISOString();
  const recordingId = `${event.call_recording.session_id}-${startTime}`;
  const [callType, callId] = event.call_cid.split(':');
  const { call, members } = await client.video.getCall({
    type: callType,
    id: callId,
  });
  const primaryMember = members.find((member) => member.role === 'stream');

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

  const body = JSON.stringify({
    title: call.custom.name ?? 'Pronto Sales Call',
    clientUniqueId: recordingId,
    actualStart: startTime,
    primaryUser,
    downloadMediaUrl: event.call_recording.url,
    parties: members.map((member) =>
      member === primaryMember
        ? {
            userId: primaryUser,
            name: primaryMember.user.name,
            emailAddress: primaryMember.user.custom.email,
          }
        : { name: member.user.name || member.user_id },
    ),
    direction: 'Outbound',
  });
  const res = await fetch(`${process.env.GONG_BASE_URL}/v2/calls`, {
    method: 'POST',
    headers: {
      Authorization: basicAuth,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (res.status !== 200) {
    console.error(
      `Could not upload recording for call ${event.call_cid}`,
      await res.json(),
    );
    console.warn(
      `To retry uploading manually after the problem is fixed:
POST ${process.env.GONG_BASE_URL}/v2/calls
Authentication: Basic ***
Content-Type: application/json

${body}`,
    );
    return;
  }

  console.log(
    `Uploaded recording for call ${event.call_cid} with user ${primaryUser} (${primaryMember.user.custom.email}) as primary`,
    await res.json(),
  );
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
