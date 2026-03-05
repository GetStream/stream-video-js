import type {
  InternalAndroidOptions,
  InternalIOSOptions,
  EndCallReason,
  TextTransformer,
} from '../types';
import type { DeepRequired } from './types';

export const defaultTextTransformer: TextTransformer = (text: string) => text;

export const defaultiOSOptions: Required<InternalIOSOptions> = {
  supportsVideo: true,
  maximumCallsPerCallGroup: 1,
  maximumCallGroups: 1,
  handleType: 'generic',
  sound: '',
  imageName: '',
  callsHistory: false,
  displayCallTimeout: 60000, // 1 minute
};

export const defaultAndroidOptions: DeepRequired<InternalAndroidOptions> = {
  incomingChannel: {
    id: 'stream_incoming_calls_channel',
    name: 'Incoming calls',
    sound: '',
    vibration: false,
  },
  ongoingChannel: {
    id: 'stream_ongoing_calls_channel',
    name: 'Ongoing calls',
  },
};

// iOS: maps to CXCallEndedReason raw values.
// See https://developer.apple.com/documentation/callkit/cxcallendedreason
// CXCallEndedReason: failed=1, remoteEnded=2, unanswered=3, answeredElsewhere=4, declinedElsewhere=5
export const iosEndCallReasonMap: Record<EndCallReason, number> = {
  local: -1, // special: uses endCall() instead of endCallWithReason()
  remote: 2, // .remoteEnded
  rejected: 5, // .declinedElsewhere
  busy: 3, // .unanswered
  answeredElsewhere: 4, // .answeredElsewhere
  missed: 3, // .unanswered
  error: 1, // .failed
  canceled: 2, // .remoteEnded (caller canceled before answer)
  restricted: 1, // .failed (no iOS equivalent)
  unknown: 1, // .failed (no iOS equivalent)
};

// Android: maps to android.telecom.DisconnectCause constants.
// See https://developer.android.com/reference/android/telecom/DisconnectCause
export const androidEndCallReasonMap: Record<EndCallReason, number> = {
  local: 2, // LOCAL
  remote: 3, // REMOTE
  rejected: 6, // REJECTED
  busy: 7, // BUSY
  answeredElsewhere: 11, // ANSWERED_ELSEWHERE
  missed: 5, // MISSED
  error: 1, // ERROR
  canceled: 4, // CANCELED
  restricted: 8, // RESTRICTED
  unknown: 0, // UNKNOWN
};
