import { useEffect } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useCalls,
} from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../utils/StreamVideoRN';
import { getCallingxLibIfAvailable } from '../utils/push/libs/callingx';

const NativeManager = NativeModules.StreamInCallManager;
const CallingxModule = getCallingxLibIfAvailable();

const ACTIVE_CALLING_STATES: CallingState[] = [
  CallingState.JOINING,
  CallingState.JOINED,
  CallingState.RECONNECTING,
  CallingState.MIGRATING,
];

/**
 * Sounds played while a call is ringing.
 *
 * - **Android**: a file in `res/raw`, with or without extension (`'incoming_call'` or
 *   `'incoming_call.mp3'`). A full `content://` / `android.resource://` URI also works.
 * - **iOS**: a file in the app bundle, with or without extension.
 */
export type RingtoneOptions = {
  /** Played when someone is calling you. */
  incoming?: string;
  /** Played while you wait for the callee to answer your outgoing call. */
  outgoing?: string;
  /**
   * Android only: play the sound on the call stream, so it stays audible when the device is
   * in silent or vibrate mode. Otherwise it plays with ringtone attributes and follows the
   * ring volume. Ignored on iOS, where the sound follows the call's audio session.
   * @default false
   */
  playIfMuted?: boolean;
};

const isIncomingRungByTheSystem = (cid: string | undefined): boolean => {
  if (!CallingxModule) {
    return false;
  }

  if (cid && CallingxModule.isCallTracked(cid)) {
    // The call is tracked by callingx, so it is rung by the system.
    return true;
  }

  const pushConfig = StreamVideoRN.getConfig().push;
  const skipInForeground =
    Platform.OS === 'ios'
      ? pushConfig?.ios?.skipIncomingPushInForeground
      : pushConfig?.android?.skipIncomingPushInForeground;
  return !(skipInForeground && AppState.currentState === 'active');
};

/**
 * Plays a ringtone while a call is ringing, and stops it as soon as the call is answered,
 * rejected, cancelled or times out.
 *
 * @example
 * ```tsx
 * const Ringtone = () => {
 *   useRingtone({ incoming: 'incoming_call', outgoing: 'outgoing_call' });
 *   return null;
 * };
 * ```
 */
export const useRingtone = ({
  incoming,
  outgoing,
  playIfMuted = false,
}: RingtoneOptions) => {
  const call = useCall();
  const cid = call?.cid;
  const isCallCreatedByMe = call?.isCreatedByMe;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const calls = useCalls();

  const hasOtherActiveCall = calls.some(
    (c) =>
      c.cid !== call?.cid &&
      ACTIVE_CALLING_STATES.includes(c.state.callingState),
  );

  useEffect(() => {
    if (callingState !== CallingState.RINGING) {
      return;
    }

    const logger = videoLoggerSystem.getLogger('useRingtone');
    let soundName: string | undefined;
    if (isCallCreatedByMe) {
      soundName = outgoing;
    } else if (isIncomingRungByTheSystem(cid) || hasOtherActiveCall) {
      logger.debug(
        'skipping the incoming sound, the OS rings incoming calls for this app or there is another active call',
      );
    } else {
      soundName = incoming;
    }

    if (!soundName) {
      return;
    }

    try {
      NativeManager.playSound(soundName, playIfMuted);
    } catch (error) {
      logger.warn(`failed to play "${soundName}"`, error);
      return;
    }

    return () => {
      try {
        NativeManager.stopSound();
      } catch (error) {
        logger.warn('failed to stop the sound', error);
      }
    };
  }, [
    callingState,
    cid,
    isCallCreatedByMe,
    hasOtherActiveCall,
    incoming,
    outgoing,
    playIfMuted,
  ]);
};
