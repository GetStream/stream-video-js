import { AppState } from 'react-native';
import { mmkvStorage } from '../contexts/createStoreContext';
import {
  E2E_JS_HEARTBEAT_INTERVAL_MS,
  E2E_JS_HEARTBEAT_TAG,
  E2E_ONGOING_CALLS_USER_PREFIX,
  E2E_USER_PREFIX,
} from '../constants/e2e';

/**
 * Test-only helpers for the e2e keep-call-alive tests (`e2e/tests/KeepCallAliveTests.e2e.ts`).
 * They only change anything for users whose id starts with `e2e_`.
 */

/** The signed-in user's id from storage, or an empty string. Never throws. */
const readSignedInUserId = (): string => {
  try {
    const raw = mmkvStorage.getString('userId');
    return raw ? String(JSON.parse(raw)) : '';
  } catch {
    return '';
  }
};

/** Whether the app should turn on `enableOngoingCalls` for Android. See `src/constants/e2e.ts`. */
export const isE2EOngoingCallsUser = () =>
  readSignedInUserId().startsWith(E2E_ONGOING_CALLS_USER_PREFIX);

let heartbeatStarted = false;

/**
 * Logs `[e2e] js heartbeat #<n> appState=<state>` every 5 seconds while an e2e user is signed in.
 *
 * React Native pauses JS timers when the app goes to the background, unless a headless task is
 * running. The keep-call-alive task is that headless task. So these lines keep coming while the
 * screen is locked only if the keep-alive works. The e2e suite reads them from logcat.
 *
 * Started when the JS bundle loads, so it also runs when a push starts the app from a killed state.
 * It checks the user on every tick because the user can sign in or out without a restart.
 */
export const startE2EJsHeartbeat = () => {
  if (heartbeatStarted) {
    return;
  }
  heartbeatStarted = true;
  let beat = 0;
  setInterval(() => {
    beat += 1;
    if (!readSignedInUserId().startsWith(E2E_USER_PREFIX)) {
      return;
    }
    console.log(
      `${E2E_JS_HEARTBEAT_TAG} #${beat} appState=${AppState.currentState}`,
    );
  }, E2E_JS_HEARTBEAT_INTERVAL_MS);
};
