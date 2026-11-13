/**
 * Values the e2e suite (`e2e/`) shares with the app. This file has no imports, so the suite can
 * import it on the host, outside React Native.
 */

/** Every user the e2e suite signs in with starts with this. */
export const E2E_USER_PREFIX = 'e2e_';

/**
 * Users whose id starts with this sign in with `enableOngoingCalls` on for Android, so callingx
 * keeps their regular (not ringing) calls alive instead of the SDK's own service. The push config is
 * set when the app starts, so the app must be relaunched after signing in for this to apply.
 */
export const E2E_ONGOING_CALLS_USER_PREFIX = 'e2e_ongoing_calls_';

/**
 * Users whose id starts with this have picture-in-picture turned off in the call screen
 * (`src/components/ActiveCall.tsx`). With it on, pressing Home during a call shrinks the app into a
 * picture-in-picture window, which keeps it in the foreground, so the app never reaches the
 * background.
 */
export const E2E_NO_PIP_USER_PREFIX = 'e2e_no_pip_';

/**
 * The app logs this line every {@link E2E_JS_HEARTBEAT_INTERVAL_MS} while an e2e user is signed in
 * (`src/utils/e2eJsHeartbeat.ts`). The line comes from a JS timer, so a gap in these lines means
 * the JS timers stopped, e.g. because the app went to the background without a keep-alive task.
 */
export const E2E_JS_HEARTBEAT_TAG = '[e2e] js heartbeat';

export const E2E_JS_HEARTBEAT_INTERVAL_MS = 5_000;
