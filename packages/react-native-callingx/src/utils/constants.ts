import type {
  AndroidOptions,
  iOSOptions,
  EndCallReason,
  TextTransformer,
} from '../types';
import type { DeepRequired } from './types';

export const defaultTextTransformer: TextTransformer = (text: string) => text;

export const defaultiOSOptions: Required<iOSOptions> = {
  supportsVideo: true,
  maximumCallsPerCallGroup: 1,
  maximumCallGroups: 1,
  handleType: 'generic',
  sound: '',
  imageName: '',
  callsHistory: false,
  setupAudioSession: true,
};

export const defaultAndroidOptions: DeepRequired<AndroidOptions> = {
  incomingChannel: {
    id: 'incoming_calls_channel',
    name: 'Incoming calls',
    sound: '',
    vibration: false,
  },
  outgoingChannel: {
    id: 'ongoing_calls_channel',
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
