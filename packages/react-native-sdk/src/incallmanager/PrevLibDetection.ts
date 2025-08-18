import { getLogger } from '@stream-io/video-client';

export type RNInCallManagerLib = typeof import('react-native-incall-manager');

let rnInCallManagerLib: RNInCallManagerLib | undefined;

try {
  rnInCallManagerLib = require('react-native-incall-manager');
} catch {}

export function getRNInCallManagerLibNoThrow() {
  if (rnInCallManagerLib) {
    getLogger(['getRNInCallManagerLibNoThrow'])(
      'debug',
      'react-native-incall-manager library is not required to be installed from 1.20.0 version of the @stream-io/video-react-native-sdk. Please check the documentation for more details.',
    );
  }
  return rnInCallManagerLib;
}
