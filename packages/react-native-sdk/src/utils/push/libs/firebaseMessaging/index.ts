import { lib, type MessagingModule } from './lib';

const INSTALLATION_INSTRUCTION =
  'Please see https://rnfirebase.io/messaging/usage#installation for installation instructions';

export type FirebaseRemoteMessage = NonNullable<
  Awaited<ReturnType<MessagingModule['getInitialNotification']>>
>;

export type FirebaseMessagingCompat = {
  getToken: () => Promise<string>;
  onTokenRefresh: (listener: (token: string) => void) => () => void;
};

function getFirebaseMessagingModule() {
  if (!lib) {
    throw Error(
      '@react-native-firebase/messaging is not installed. ' +
        INSTALLATION_INSTRUCTION,
    );
  }
  return lib;
}

export function getFirebaseMessagingLib(): () => FirebaseMessagingCompat {
  const messagingModule = getFirebaseMessagingModule();
  return () => {
    const messaging = messagingModule.getMessaging();
    return {
      getToken: () => messagingModule.getToken(messaging),
      onTokenRefresh: (listener) =>
        messagingModule.onTokenRefresh(messaging, listener),
    };
  };
}
