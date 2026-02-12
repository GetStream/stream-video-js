let pendingResolve: (() => void) | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
/**
 * Flag to check if the incoming call is already displayed.
 * This solves race condition for a case, when the didDisaplayIncomingCall is triggered before the promise is created
 */
let isAlreadyDisplayedIncomingCall = false;

const DISPLAY_INCOMING_CALL_TIMEOUT_MS = 5000;

export const waitForDisplayIncomingCall = (
  timeoutMs: number = DISPLAY_INCOMING_CALL_TIMEOUT_MS,
): Promise<void> => {
  if (isAlreadyDisplayedIncomingCall) {
    isAlreadyDisplayedIncomingCall = false;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    pendingResolve = resolve;
    pendingTimeout = setTimeout(() => {
      // Resolve on timeout to prevent hanging
      resolveDisplayIncomingCall();
    }, timeoutMs);
  });
};

export function resolveDisplayIncomingCall() {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }

  if (pendingResolve) {
    pendingResolve();
    pendingResolve = null;
    isAlreadyDisplayedIncomingCall = false;
  } else {
    isAlreadyDisplayedIncomingCall = true;
  }
}
