import type { StreamVideoClient } from '@stream-io/video-react-native-sdk';

/**
 * Test-only workaround for the e2e suite (`e2e/tests/RingingTests.e2e.ts`). It reproduces a ring
 * whose call settings arrive after the call starts ringing.
 *
 * Normally the settings arrive with `call.created`, which the server sends before `call.ring`. An
 * app in the background can miss `call.created`. The ring then comes by push, and the SDK starts
 * ringing before the settings arrive. Detox can't test a killed app (killing it force-stops it, and
 * Android then drops its pushes), so the app ignores WebSocket events instead, for users whose id
 * starts with {@link E2E_RING_FROM_PUSH_USER_PREFIX}:
 *
 * - On CI (the default), it ignores only `call.created`. CI's emulator image has no Google Play
 *   services, so no push can arrive there. `call.ring` then is the first event for the call, and
 *   the SDK starts ringing before it applies the event's settings: the same late settings, over
 *   the WebSocket.
 * - For local testing on a device with Google Play services, set {@link RING_BY_PUSH} to `true`.
 *   The app then also ignores `call.ring`, so the ring arrives by push, the way it does for an app
 *   in the background.
 */
export const RING_BY_PUSH = false;

export const E2E_RING_FROM_PUSH_USER_PREFIX = 'e2e_ring_from_push_';

type DispatchEvent = StreamVideoClient['streamClient']['dispatchEvent'];

const ignoredEvents = new Set(
  RING_BY_PUSH ? ['call.created', 'call.ring'] : ['call.created'],
);
const wrappedClients = new WeakSet<object>();

/**
 * Wraps the client's event dispatch from the outside, so the SDK keeps no test-only code. Every
 * WebSocket message goes through `streamClient.dispatchEvent`, which the connection looks up on
 * each message.
 */
export const ignoreRingEventsFromWebSocket = (client: StreamVideoClient) => {
  const { streamClient } = client;
  if (wrappedClients.has(streamClient)) {
    return;
  }
  wrappedClients.add(streamClient);
  const dispatchEvent: DispatchEvent = streamClient.dispatchEvent;
  streamClient.dispatchEvent = (event) => {
    if (ignoredEvents.has(event.type)) {
      console.log(`[e2e] ignoring ${event.type} from the WebSocket`);
      return;
    }
    dispatchEvent(event);
  };
};

/** Applies {@link ignoreRingEventsFromWebSocket} for the e2e ringing test users. */
export const ignoreRingEventsFromWebSocketForE2EUser = (
  client: StreamVideoClient,
  userId: string,
) => {
  if (userId.startsWith(E2E_RING_FROM_PUSH_USER_PREFIX)) {
    ignoreRingEventsFromWebSocket(client);
  }
};
