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

export const defaultAndroidOptions: Omit<
  DeepRequired<InternalAndroidOptions>,
  'notificationTexts'
> = {
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

// Android: maps to a limited subset of android.telecom.DisconnectCause constants
// that are allowed when using the CallControl / core-telecom APIs.
//
// Per platform docs, only the following codes are valid when disconnecting a call:
// - DisconnectCause.LOCAL
// - DisconnectCause.REMOTE
// - DisconnectCause.REJECTED
// - DisconnectCause.MISSED
//
// Numeric values (from android.telecom.DisconnectCause):
// UNKNOWN = 0, ERROR = 1, LOCAL = 2, REMOTE = 3, REJECTED = 4, MISSED = 5
//
// We therefore collapse all high-level EndCallReason variants to this allowed set.
export const androidEndCallReasonMap: Record<EndCallReason, number> = {
  local: 2, // LOCAL
  remote: 3, // REMOTE
  rejected: 4, // REJECTED
  busy: 4, // map busy -> REJECTED
  answeredElsewhere: 3, // map answeredElsewhere -> REMOTE
  missed: 5, // MISSED
  error: 2, // map error -> LOCAL
  canceled: 2, // map canceled -> LOCAL
  restricted: 4, // map restricted -> REJECTED
  unknown: 2, // map unknown -> LOCAL
};
