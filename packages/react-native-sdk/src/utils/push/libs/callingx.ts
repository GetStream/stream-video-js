import { StreamVideoConfig } from '../../StreamVideoRN/types';

export type RNCallingxType =
  import('@stream-io/react-native-callingx').ICallingxModule;
export type EventData = import('@stream-io/react-native-callingx').EventData;
export type EventParams =
  import('@stream-io/react-native-callingx').EventParams;
export type CallingExpOptions =
  import('@stream-io/react-native-callingx').CallingExpOptions;

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

export function extractCallingExpOptions(
  pushConfig: NonNullable<StreamVideoConfig['push']>,
): CallingExpOptions {
  const callingExpOptions: CallingExpOptions = {};

  if (pushConfig.ios) {
    const iosOptions: CallingExpOptions['ios'] = {};
    if (pushConfig.ios.supportsVideo !== undefined) {
      iosOptions.supportsVideo = pushConfig.ios.supportsVideo;
    }
    if (pushConfig.ios.sound !== undefined) {
      iosOptions.sound = pushConfig.ios.sound;
    }
    if (pushConfig.ios.imageName !== undefined) {
      iosOptions.imageName = pushConfig.ios.imageName;
    }
    if (pushConfig.ios.callsHistory !== undefined) {
      iosOptions.callsHistory = pushConfig.ios.callsHistory;
    }
    if (pushConfig.ios.displayCallTimeout !== undefined) {
      iosOptions.displayCallTimeout = pushConfig.ios.displayCallTimeout;
    }

    if (Object.keys(iosOptions).length > 0) {
      callingExpOptions.ios = iosOptions;
    }
  }

  if (pushConfig.android) {
    const androidOptions: CallingExpOptions['android'] = {};
    if (pushConfig.android.incomingChannel) {
      androidOptions.incomingChannel = pushConfig.android.incomingChannel;
    }
    if (pushConfig.android.ongoingChannel) {
      androidOptions.ongoingChannel = pushConfig.android.ongoingChannel;
    }
    if (pushConfig.android.titleTransformer) {
      androidOptions.titleTransformer = pushConfig.android.titleTransformer;
    }
    if (pushConfig.android.subtitleTransformer) {
      androidOptions.subtitleTransformer =
        pushConfig.android.subtitleTransformer;
    }

    if (Object.keys(androidOptions).length > 0) {
      callingExpOptions.android = androidOptions;
    }
  }

  if (pushConfig.shouldRejectCallWhenBusy !== undefined) {
    callingExpOptions.shouldRejectCallWhenBusy =
      pushConfig.shouldRejectCallWhenBusy;
  }

  return callingExpOptions;
}
