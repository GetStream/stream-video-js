import { lib, type Type } from './lib';

export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
export type FirebaseMessagingType = Type;

const INSTALLATION_INSTRUCTION =
  'Please see https://rnfirebase.io/messaging/usage#installation for installation instructions';

export function getFirebaseMessagingLib(): FirebaseMessagingType {
  if (!lib) {
    throw Error(
      '@react-native-firebase/messaging is not installed. ' +
        INSTALLATION_INSTRUCTION,
    );
  }
  return lib;
}
