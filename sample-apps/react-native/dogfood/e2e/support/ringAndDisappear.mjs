// Rings a user from a caller that disappears right after ringing: it never hangs up, cancels or
// rejects, as if the caller's app was killed. The server then only sends the callee `call.missed`
// (after the call type's `missed_call_timeout_ms`), which doesn't end the call on the callee, so
// only the callee's own ring timeout (`incoming_call_timeout_ms`) can end it.
//
// It runs as its own Node process because Jest's test environment doesn't expose Node's
// `WebSocket`, and the caller has to connect once so that its user exists.
//
//   node e2e/support/ringAndDisappear.mjs <callee user id> [--wait-for-push-device]
//
// `--wait-for-push-device` waits until the callee's app has registered for push, for a ring that
// must arrive by push. Prints the id of the ringing call.

const args = process.argv.slice(2);
const waitForPushDevice = args.includes('--wait-for-push-device');
const [calleeId] = args.filter((arg) => !arg.startsWith('--'));
const callType = 'default';
if (!calleeId) {
  console.error(
    'Usage: node ringAndDisappear.mjs <callee user id> [--wait-for-push-device]',
  );
  process.exit(1);
}

// The `demo` environment, the one the dogfood release build and stream-video-buddy use.
const tokenUrl = 'https://pronto.getstream.io/api/auth/create-token';
const apiHost = 'video.stream-io-api.com';

const randomId = () => Math.random().toString(36).slice(2, 10);
const callerId = `e2e_caller_${randomId()}`;
const callId = `e2e-${randomId()}`;

const createToken = async (userId) => {
  const url = new URL(tokenUrl);
  url.searchParams.set('user_id', userId);
  url.searchParams.set('environment', 'demo');
  url.searchParams.set('exp', String(10 * 60));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not create a token: ${response.status}`);
  }
  return response.json();
};

// Connecting once creates the caller's user, which the API needs before it can ring.
const createUser = ({ apiKey, token }) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(
      `wss://${apiHost}/video/connect?api_key=${apiKey}&stream-auth-type=jwt&X-Stream-Client=e2e-ring-and-disappear`,
    );
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('The caller could not connect within 20s'));
    }, 20_000);
    ws.onopen = () =>
      ws.send(JSON.stringify({ token, user_details: { id: callerId } }));
    ws.onmessage = ({ data }) => {
      const event = JSON.parse(data);
      if (event.type === 'connection.ok') {
        clearTimeout(timer);
        ws.close();
        resolve();
      } else if (event.type === 'connection.error') {
        clearTimeout(timer);
        ws.close();
        reject(new Error(`The caller could not connect: ${data}`));
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error('The caller could not connect'));
    };
  });

const ring = async ({ apiKey, token }) => {
  const response = await fetch(
    `https://${apiHost}/video/call/${callType}/${callId}?api_key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'stream-auth-type': 'jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ring: true,
        data: { members: [{ user_id: callerId }, { user_id: calleeId }] },
      }),
    },
  );
  return {
    ok: response.ok,
    status: response.status,
    body: await response.text(),
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The app registers its push token a moment after it connects. Without a device, the server has
// nowhere to send the ring.
const waitForCalleePushDevice = async () => {
  const { apiKey, token } = await createToken(calleeId);
  const deadline = Date.now() + 30_000;
  for (;;) {
    const response = await fetch(
      `https://${apiHost}/video/devices?api_key=${apiKey}`,
      { headers: { Authorization: token, 'stream-auth-type': 'jwt' } },
    );
    const { devices = [] } = response.ok ? await response.json() : {};
    if (devices.length > 0) {
      return;
    }
    if (Date.now() > deadline) {
      console.error(`${calleeId} did not register for push within 30s`);
      process.exit(1);
    }
    await sleep(2_000);
  }
};

const credentials = await createToken(callerId);
await createUser(credentials);
if (waitForPushDevice) {
  await waitForCalleePushDevice();
}

// The app connects (and so creates the callee's user) a moment after the sign-in screen closes.
const deadline = Date.now() + 30_000;
for (;;) {
  const result = await ring(credentials);
  if (result.ok) {
    break;
  }
  // e.g. "The following users are involved in call create operation, but don't exist: [...]"
  const calleeNotCreatedYet =
    result.status < 500 &&
    result.body.includes("don't exist") &&
    result.body.includes(calleeId);
  if (!calleeNotCreatedYet || Date.now() > deadline) {
    console.error(
      `Ringing ${calleeId} failed: ${result.status} ${result.body}`,
    );
    process.exit(1);
  }
  await sleep(2_000);
}

// No hang-up, cancel or reject from here on: the caller is gone.
console.log(callId);
