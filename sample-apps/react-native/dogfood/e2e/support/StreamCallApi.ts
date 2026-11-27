/**
 * Reads a call from Stream's API on the host, to check from outside the device who is on it.
 * Uses the same token service and environment as the app (`demo` by default, the one release
 * builds and stream-video-buddy use). Set `E2E_STREAM_ENVIRONMENT` when the app on the device
 * uses another one, e.g. `pronto` for a debug build switched to it on the login screen.
 */

export const streamEnvironment = process.env.E2E_STREAM_ENVIRONMENT ?? 'demo';

const tokenUrl = 'https://pronto.getstream.io/api/auth/create-token';
const apiHost = 'video.stream-io-api.com';

type Credentials = { apiKey: string; token: string };

const credentialsByUser = new Map<string, Promise<Credentials>>();

const createToken = (userId: string): Promise<Credentials> => {
  let credentials = credentialsByUser.get(userId);
  if (!credentials) {
    credentials = (async () => {
      const url = new URL(tokenUrl);
      url.searchParams.set('user_id', userId);
      url.searchParams.set('environment', streamEnvironment);
      url.searchParams.set('exp', String(60 * 60));
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not create a token: ${response.status}`);
      }
      return (await response.json()) as Credentials;
    })();
    credentialsByUser.set(userId, credentials);
  }
  return credentials;
};

export type SessionParticipant = {
  userId: string;
  /** Changes when the user leaves and joins again, e.g. after the SDK rejoins a dropped call. */
  userSessionId: string;
};

/**
 * Who is on the call right now, according to the server.
 *
 * @param readAsUserId the user whose token reads the call. Any user who may read the call works;
 * the app's own user always may.
 */
export const getSessionParticipants = async (
  callId: string,
  readAsUserId: string,
  callType = 'default',
): Promise<SessionParticipant[]> => {
  const { apiKey, token } = await createToken(readAsUserId);
  const response = await fetch(
    `https://${apiHost}/video/call/${callType}/${callId}?api_key=${apiKey}`,
    { headers: { Authorization: token, 'stream-auth-type': 'jwt' } },
  );
  if (!response.ok) {
    throw new Error(
      `Could not read call ${callType}:${callId}: ${response.status} ${await response.text()}`,
    );
  }
  const body = (await response.json()) as {
    call?: {
      session?: {
        participants?: { user?: { id?: string }; user_session_id?: string }[];
      };
    };
  };
  return (body.call?.session?.participants ?? []).map((participant) => ({
    userId: participant.user?.id ?? '',
    userSessionId: participant.user_session_id ?? '',
  }));
};

/** Waits until `userId` is on the call, and returns their session. */
export const waitForUserOnCall = async (
  callId: string,
  userId: string,
  timeout = 60_000,
): Promise<SessionParticipant> => {
  const deadline = Date.now() + timeout;
  let lastSeen: SessionParticipant[] = [];
  for (;;) {
    lastSeen = await getSessionParticipants(callId, userId);
    const session = lastSeen.find((p) => p.userId === userId);
    if (session) {
      return session;
    }
    if (Date.now() > deadline) {
      throw new Error(
        `${userId} did not join call ${callId} within ${timeout / 1000}s. ` +
          `On the call: [${lastSeen.map((p) => p.userId).join(', ')}]`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
};

/**
 * Waits until `userId`'s app has registered a device for push. The app registers a moment after
 * it signs in. Without a device, the server has nowhere to send a ring.
 */
export const waitForPushDevice = async (userId: string, timeout = 60_000) => {
  const { apiKey, token } = await createToken(userId);
  const deadline = Date.now() + timeout;
  for (;;) {
    const response = await fetch(
      `https://${apiHost}/video/devices?api_key=${apiKey}`,
      { headers: { Authorization: token, 'stream-auth-type': 'jwt' } },
    );
    const { devices = [] } = response.ok
      ? ((await response.json()) as { devices?: unknown[] })
      : {};
    if (devices.length > 0) {
      return;
    }
    if (Date.now() > deadline) {
      throw new Error(
        `${userId} did not register for push within ${timeout / 1000}s`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
};
