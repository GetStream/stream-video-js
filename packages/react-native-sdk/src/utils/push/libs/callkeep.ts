export type RNCallKeepType = typeof import('react-native-callkeep').default;

let callkeep: RNCallKeepType | undefined;

try {
  callkeep = require('react-native-callkeep').default;
} catch {}

export function getCallKeepLib() {
  if (!callkeep) {
    throw Error(
      'react-native-callkeep library is not installed. Please see https://github.com/react-native-webrtc/react-native-callkeep#Installation for installation instructions',
    );
  }
  return callkeep;
}
