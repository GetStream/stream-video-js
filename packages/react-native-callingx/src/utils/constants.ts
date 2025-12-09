import type {
  AndroidOptions,
  iOSOptions,
  EndCallReason,
  TextTransformer,
} from '../types';

export const defaultTextTransformer: TextTransformer = (text: string) => text;

export const defaultiOSOptions: Required<iOSOptions> = {
  appName: 'My App',
  supportsVideo: true,
  maximumCallsPerCallGroup: 1,
  maximumCallGroups: 1,
  handleType: 'generic',
  sound: null,
};

export const defaultAndroidOptions: Required<AndroidOptions> = {
  incomingChannel: {
    id: 'telecom_incoming_channel',
    name: 'Incoming calls',
    sound: '',
    vibration: false,
  },
  outgoingChannel: {
    id: 'telecom_ongoing_channel',
    name: 'Ongoing calls',
  },
};

// See ios/Callingx.mm for native iOS logic and constants mapping.
export const iosEndCallReasonMap: Record<EndCallReason, number> = {
  local: -1,
  remote: 1,
  rejected: 4,
  busy: 2,
  answeredElsewhere: 3,
  missed: 2,
  error: 0,
};

// https://developer.android.com/reference/android/telecom/DisconnectCause
export const androidEndCallReasonMap: Record<EndCallReason, number> = {
  local: 2,
  remote: 3,
  rejected: 6,
  busy: 7,
  answeredElsewhere: 11,
  missed: 5,
  error: 1,
};
