export type RNCallingxType =
  import('@stream-io/react-native-callingx').ICallingxModule;
export type EventParams =
  import('@stream-io/react-native-callingx').EventParams;
export type Options = import('@stream-io/react-native-callingx').Options;

let callingx: RNCallingxType | undefined;

try {
  callingx = require('@stream-io/react-native-callingx').CallingxModule;
} catch {}

export function getCallingxLib() {
  if (!callingx) {
    throw Error('react-native-callingx library is not installed.');
  }
  return callingx;
}

export function getCallingxLibIfAvailable() {
  return callingx ?? undefined;
}
