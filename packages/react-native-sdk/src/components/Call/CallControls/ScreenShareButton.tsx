import React, { useEffect, useRef } from 'react';
import { NativeModules, Platform, findNodeHandle } from 'react-native';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { ScreenShare } from '../../../icons';
import { CallControlsButton } from './CallControlsButton';
import { SfuModels } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts';
import { useIsIosScreenshareBroadcastStarted } from '../../../hooks';
import { usePrevious } from '../../../utils/hooks';

/**
 * The props for the Screen Share button in the Call Controls.
 */
export type ScreenShareButtonProps = {
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

// ios >= 14.0 or android
const CanScreenShare =
  (Platform.OS === 'ios' &&
    Number.parseInt(Platform.Version.split('.')[0], 10) >= 14) ||
  Platform.OS === 'android';

/**
 * Button to start/stop screen share.
 * Note: This button is enabled only on iOS >= 14.0 and any Android version.
 */
export const ScreenShareButton = ({
  onScreenShareStartedHandler,
  onScreenShareStoppedHandler,
}: ScreenShareButtonProps) => {
  const {
    theme: { colors, screenShareButton },
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

  const iosScreenShareStarted = useIsIosScreenshareBroadcastStarted();
  const prevIosScreenShareStarted = usePrevious(iosScreenShareStarted);

  const localParticipant = useLocalParticipant();
  const hasPublishedScreenShare = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  // listens to iOS screen share broadcast started event
  useEffect(() => {
    const run = async () => {
      if (Platform.OS !== 'ios') {
        return;
      }
      if (iosScreenShareStarted && !prevIosScreenShareStarted) {
        onScreenShareStartedHandlerRef.current?.();
        const media = await navigator.mediaDevices.getDisplayMedia({
          // @ts-ignore
          deviceId: 'broadcast',
          video: true,
          audio: true,
        });
        await call?.publishScreenShareStream(media);
      } else if (!iosScreenShareStarted && prevIosScreenShareStarted) {
        onScreenShareStoppedHandlerRef.current?.();
        await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
      }
    };
    run();
  }, [call, iosScreenShareStarted, prevIosScreenShareStarted]);

  const screenCaptureRef = React.useRef(null);

  const onPress = async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCaptureRef.current);
      await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
      // After this the iOS screen share broadcast started/stopped event will be triggered
      // and the useEffect listener will handle the rest
    } else {
      if (!hasPublishedScreenShare) {
        try {
          const media = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          onScreenShareStartedHandlerRef.current?.();
          await call?.publishScreenShareStream(media);
        } catch (e) {
          // ignored.. user didnt allow the screen share in the popup
        }
      } else if (hasPublishedScreenShare) {
        onScreenShareStoppedHandlerRef.current?.();
        await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
      }
    }
  };

  if (!isScreenSharingEnabledInCall || !CanScreenShare) {
    return;
  }

  return (
    <CallControlsButton
      disabled={!isScreenSharingAccessRequestEnabled}
      onPress={onPress}
      color={colors.static_white}
      style={{
        container: screenShareButton.container,
        svgContainer: screenShareButton.svgContainer,
      }}
    >
      <ScreenShare color={colors.static_black} />
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCaptureRef} />
      )}
    </CallControlsButton>
  );
};
