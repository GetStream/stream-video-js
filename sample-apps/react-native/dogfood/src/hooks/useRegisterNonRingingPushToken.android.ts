/**
 * No-op on Android — the SDK already registers the Firebase token
 * with the Stream backend via initAndroidPushToken.
 */
export const useRegisterNonRingingPushToken = () => {};
