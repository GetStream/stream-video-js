type UnsubscribeCallback = () => void;

/**
 * This map is used to store the unsubscribe callbacks (if any) of the push notification processing
 * Note: it should be used to clear it when app processes push notification from foreground
 */
export const pushUnsubscriptionCallbacks = new Map<
  string,
  UnsubscribeCallback[]
>();
