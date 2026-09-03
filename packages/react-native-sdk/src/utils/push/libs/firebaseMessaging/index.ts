import { lib, type MessagingModule } from './lib';

const INSTALLATION_INSTRUCTION =
  'Please see https://rnfirebase.io/messaging/usage#installation for installation instructions';

export type FirebaseRemoteMessage = NonNullable<
  Awaited<ReturnType<MessagingModule['getInitialNotification']>>
>;

function getFirebaseMessagingModule() {
  if (!lib) {
    throw Error(
      '@react-native-firebase/messaging is not installed. ' +
        INSTALLATION_INSTRUCTION,
    );
  }
  return lib;
}

export function getFirebaseMessagingLib() {
  const messagingModule = getFirebaseMessagingModule();
  const messaging = messagingModule.getMessaging();
  return () => ({
    getToken: () => messagingModule.getToken(messaging),
    onTokenRefresh: (listener: (token: string) => void) =>
      messagingModule.onTokenRefresh(messaging, listener),
  });
}
