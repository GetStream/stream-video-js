import React, { useEffect, useRef } from 'react';
import { NativeModules, Platform, findNodeHandle } from 'react-native';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { ScreenShare, StopScreenShare } from '../../../icons';
import { CallControlsButton } from './CallControlsButton';
import { useTheme } from '../../../contexts';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useIsIosScreenshareBroadcastStarted } from '../../../hooks/useIsIosScreenshareBroadcastStarted';
import { SfuModels } from '@stream-io/video-client';
import { usePrevious } from '../../../utils/hooks/usePrevious';

// ios >= 14.0 or android - platform restrictions
const CanDeviceScreenShare =
  (Platform.OS === 'ios' &&
    // @ts-ignore
    Number.parseInt(Platform.Version.split('.')[0], 10) >= 14) ||
  Platform.OS === 'android';

/**
 * The props for the Screen Share button in the Call Controls.
 */
export type ScreenShareToggleButtonProps = {
  /**
   * Handler to be called when the screen-share has been started.
   *
   */
  onScreenShareStartedHandler?: () => void;
  /**
   * Handler to be called when the screen-share has been stopped.
   *
   */
  onScreenShareStoppedHandler?: () => void;
};

/**
 * Button to start/stop screen share.
 * Note: This button is enabled only on iOS >= 14.0 and any Android version.
 */
export const ScreenShareToggleButton = ({
  onScreenShareStartedHandler,
  onScreenShareStoppedHandler,
}: ScreenShareToggleButtonProps) => {
  const {
    theme: { colors, screenShareToggleButton },
  } = useTheme();

  const call = useCall();
  const { useLocalParticipant, useCallSettings } = useCallStateHooks();
  const callSettings = useCallSettings();
  const isScreenSharingEnabledInCall = callSettings?.screensharing.enabled;
  const isScreenSharingAccessRequestEnabled =
    callSettings?.screensharing.access_request_enabled;

  const onScreenShareStartedHandlerRef = useRef(onScreenShareStartedHandler);
  onScreenShareStartedHandlerRef.current = onScreenShareStartedHandler;
  const onScreenShareStoppedHandlerRef = useRef(onScreenShareStoppedHandler);
  onScreenShareStoppedHandlerRef.current = onScreenShareStoppedHandler;

  const iosScreenShareStartedFromSystem = useIsIosScreenshareBroadcastStarted();
  const prevIosScreenShareStartedFromSystem = usePrevious(
    iosScreenShareStartedFromSystem,
  );

  const localParticipant = useLocalParticipant();
  const hasPublishedScreenShare = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  // listens to iOS screen share broadcast started event from the system
  useEffect(() => {
    const run = async () => {
      if (Platform.OS !== 'ios') {
        return;
      }
      if (
        iosScreenShareStartedFromSystem &&
        !prevIosScreenShareStartedFromSystem
      ) {
        onScreenShareStartedHandlerRef.current?.();
        const media = await navigator.mediaDevices.getDisplayMedia({
          // @ts-ignore
          deviceId: 'broadcast',
          video: true,
          audio: true,
        });
        await call?.publishScreenShareStream(media);
      } else if (
        !iosScreenShareStartedFromSystem &&
        prevIosScreenShareStartedFromSystem
      ) {
        onScreenShareStoppedHandlerRef.current?.();
        await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
      }
    };
    run();
  }, [
    call,
    iosScreenShareStartedFromSystem,
    prevIosScreenShareStartedFromSystem,
  ]);

  const screenCapturePickerViewiOSRef = React.useRef(null);

  const onPress = async () => {
    if (!hasPublishedScreenShare) {
      if (Platform.OS === 'ios') {
        const reactTag = findNodeHandle(screenCapturePickerViewiOSRef.current);
        await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
        // After this the iOS screen share broadcast started/stopped event will be triggered
        // and the useEffect listener will handle the rest
      } else {
        try {
          const media = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          onScreenShareStartedHandler?.();
          await call?.publishScreenShareStream(media);
        } catch (e) {
          // ignored.. user didnt allow the screen share in the popup
        }
      }
    } else if (hasPublishedScreenShare) {
      onScreenShareStoppedHandler?.();
      await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
    }
  };

  if (!isScreenSharingEnabledInCall || !CanDeviceScreenShare) {
    return null;
  }

  return (
    <CallControlsButton
      disabled={!isScreenSharingAccessRequestEnabled}
      onPress={onPress}
      color={hasPublishedScreenShare ? colors.error : colors.static_white}
      style={{
        container: screenShareToggleButton.container,
        svgContainer: screenShareToggleButton.svgContainer,
      }}
    >
      {hasPublishedScreenShare ? (
        <StopScreenShare color={colors.static_black} />
      ) : (
        <ScreenShare color={colors.static_black} />
      )}
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </CallControlsButton>
  );
};
