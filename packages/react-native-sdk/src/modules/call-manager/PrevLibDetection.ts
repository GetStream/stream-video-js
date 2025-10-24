import { getLogger } from '@stream-io/logger';

declare class RNInCallManagerLib {
  start(setup?: {
    auto?: boolean;
    media?: 'video' | 'audio';
    ringback?: string;
  }): void;

  stop(setup?: { busytone?: string }): void;
}

let rnInCallManagerLib: RNInCallManagerLib | undefined;

try {
  rnInCallManagerLib = require('react-native-incall-manager').default;
} catch {}

export function getRNInCallManagerLibNoThrow() {
  if (rnInCallManagerLib) {
    getLogger('getRNInCallManagerLibNoThrow').debug(
      'react-native-incall-manager library is not required to be installed from 1.22.0 version of the @stream-io/video-react-native-sdk. Please check the migration documentation at https://getstream.io/video/docs/react-native/migration-guides/1.22.0/ for more details.',
    );
  }
  return rnInCallManagerLib;
}
