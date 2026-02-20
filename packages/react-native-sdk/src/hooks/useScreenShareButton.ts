import {
  hasScreenShare,
  OwnCapability,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React, { useEffect, useRef } from 'react';
import { findNodeHandle, NativeModules, Platform } from 'react-native';
import { usePrevious } from '../utils/hooks';
import { useIsIosScreenshareBroadcastStarted } from './useIsIosScreenshareBroadcastStarted';
import {
  startInAppScreenCapture,
  stopInAppScreenCapture,
} from '../native/ScreenShareAudioModule';

/**
 * The type of screen sharing to use on iOS.
 *
 * - `'broadcast'` — Uses a Broadcast Upload Extension (RPSystemBroadcastPickerView).
 *   Captures the entire device screen, works across all apps. Requires an extension target.
 * - `'inApp'` — Uses RPScreenRecorder.startCapture to capture the current app's screen.
 *   Only captures the current app. Supports `.audioApp` sample buffers for audio mixing.
 *
 * On Android, this option is ignored — the system screen capture dialog is always used.
 */
export type ScreenShareType = 'broadcast' | 'inApp';

/**
 * Options for screen share behavior.
 */
export type ScreenShareOptions = {
  /**
   * The type of screen sharing on iOS. Default: `'broadcast'`.
   * On Android this is ignored.
   */
  type?: ScreenShareType;
  /**
   * Whether to capture and mix system/app audio into the microphone audio track.
   * When `true`, remote participants will hear media audio from the shared screen
   * (e.g., YouTube video audio) mixed with the user's microphone.
   *
   * - iOS in-app: Audio captured from RPScreenRecorder `.audioApp` buffers.
   * - iOS broadcast: Audio captured from the broadcast extension via socket.
   * - Android: Audio captured via AudioPlaybackCaptureConfiguration (API 29+).
   *
   * Default: `false`.
   */
  includeAudio?: boolean;
};

// ios >= 14.0 or android - platform restrictions
const CanDeviceScreenShare =
  (Platform.OS === 'ios' &&
    Number.parseInt(Platform.Version?.split('.')[0] ?? '0', 10) >= 14) ||
  Platform.OS === 'android';

export const useScreenShareButton = (
  /**
   * Ref of the ScreenCapturePickerView component.
   * Required for iOS broadcast screen sharing. Can be `null` for in-app mode.
   */
  screenCapturePickerViewiOSRef: React.MutableRefObject<any>,
  /**
   * Handler to be called when the screen-share has been started.
   *
   */
  onScreenShareStartedHandler?: () => void,
  /**
   * Handler to be called when the screen-share has been stopped.
   *
   */
  onScreenShareStoppedHandler?: () => void,
  /**
   * Handler to be called when the permissions to stream screen share media is missing
   *
   */
  onMissingScreenShareStreamPermission?: () => void,
  /**
   * Options for screen share behavior (type, includeAudio).
   */
  screenShareOptions?: ScreenShareOptions,
) => {
  const call = useCall();
  const { useLocalParticipant, useCallSettings, useOwnCapabilities } =
    useCallStateHooks();
  const callSettings = useCallSettings();
  const ownCapabilities = useOwnCapabilities();
  const hasScreenSharingPermissions = ownCapabilities?.includes(
    OwnCapability.SCREENSHARE,
  );
  const isScreenSharingEnabledInCall = callSettings?.screensharing.enabled;

  const screenShareType = screenShareOptions?.type ?? 'broadcast';
  const includeAudio = screenShareOptions?.includeAudio ?? false;

  const onScreenShareStartedHandlerRef = useRef(onScreenShareStartedHandler);
  onScreenShareStartedHandlerRef.current = onScreenShareStartedHandler;
  const onScreenShareStoppedHandlerRef = useRef(onScreenShareStoppedHandler);
  onScreenShareStoppedHandlerRef.current = onScreenShareStoppedHandler;

  const iosScreenShareStartedFromSystem = useIsIosScreenshareBroadcastStarted();
  const prevIosScreenShareStartedFromSystem = usePrevious(
    iosScreenShareStartedFromSystem,
  );

  const localParticipant = useLocalParticipant();
  const hasPublishedScreenShare =
    localParticipant && hasScreenShare(localParticipant);

  // listens to iOS screen share broadcast started event from the system
  // (only relevant for broadcast mode)
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    if (screenShareType !== 'broadcast') {
      return;
    }
    if (
      iosScreenShareStartedFromSystem &&
      !prevIosScreenShareStartedFromSystem
    ) {
      onScreenShareStartedHandlerRef.current?.();
      if (includeAudio) {
        call?.screenShare.enableScreenShareAudio();
      }
      call?.screenShare.enable();
    } else if (
      !iosScreenShareStartedFromSystem &&
      prevIosScreenShareStartedFromSystem
    ) {
      onScreenShareStoppedHandlerRef.current?.();
      call?.screenShare.disable(true);
    }
  }, [
    call,
    includeAudio,
    screenShareType,
    iosScreenShareStartedFromSystem,
    prevIosScreenShareStartedFromSystem,
  ]);

  const onPress = async () => {
    if (!hasScreenSharingPermissions) {
      const logger = videoLoggerSystem.getLogger('useScreenShareButton');
      logger.info(
        'User does not have permissions to stream the screen share media, calling onMissingScreenShareStreamPermission handler if present',
      );
      onMissingScreenShareStreamPermission?.();
    }
    if (!hasPublishedScreenShare) {
      // Set audio mixing preference before starting screen share
      if (includeAudio) {
        call?.screenShare.enableScreenShareAudio();
      } else {
        call?.screenShare.disableScreenShareAudio();
      }

      if (Platform.OS === 'ios' && screenShareType === 'inApp') {
        // In-app screen sharing on iOS — uses RPScreenRecorder directly
        try {
          await startInAppScreenCapture(includeAudio);
          await call?.screenShare.enable();
          onScreenShareStartedHandler?.();
        } catch (error) {
          const logger = videoLoggerSystem.getLogger('useScreenShareButton');
          logger.warn('Failed to start in-app screen capture', error);
        }
      } else if (Platform.OS === 'ios') {
        // Broadcast screen sharing on iOS — shows the system picker
        const reactTag = findNodeHandle(screenCapturePickerViewiOSRef.current);
        await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
        // After this the iOS screen share broadcast started/stopped event will be triggered
        // and the useEffect listener will handle the rest
      } else {
        // Android screen sharing
        try {
          await call?.screenShare.enable();
          onScreenShareStartedHandler?.();
        } catch (error) {
          // ignored.. user didnt allow the screen share in the popup
          const logger = videoLoggerSystem.getLogger('useScreenShareButton');
          logger.info(
            'User opted to not give permissions to start a screen share stream',
            error,
          );
        }
      }
    } else if (hasPublishedScreenShare) {
      onScreenShareStoppedHandler?.();
      // Stop in-app screen capture if it was active (iOS only)
      if (Platform.OS === 'ios' && screenShareType === 'inApp') {
        await stopInAppScreenCapture();
      }
      await call?.screenShare.disable(true);
    }
  };

  if (!isScreenSharingEnabledInCall || !CanDeviceScreenShare) {
    return { onPress: undefined, hasPublishedScreenShare: false };
  }
  return { onPress, hasPublishedScreenShare };
};
