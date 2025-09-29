type UnsubscribeCallback = () => void;

/**
 * This map is used to store the unsubscribe callbacks (if any) of the push notification processing in Android
 * Note: it should be used to clear it when app processes push notification from foreground
 */
export const pushUnsubscriptionCallbacksAndroid = new Map<
  string,
  UnsubscribeCallback[]
>();

/**
 * This map is used to store the unsubscribe callback (if any) of the push notification processing in iOS
 * Note: it should be used to clear it when app processes push notification from foreground
 */
export const pushUnsubscriptionCallbackIos = new Map<
  string,
  UnsubscribeCallback
>();
