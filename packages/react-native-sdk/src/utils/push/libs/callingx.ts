export type RNCallingxType = import('react-native-callingx').ICallingxModule;
export type EventParams = import('react-native-callingx').EventParams;

let callingx: RNCallingxType | undefined;

try {
  callingx = require('react-native-callingx').CallingxModule;
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
