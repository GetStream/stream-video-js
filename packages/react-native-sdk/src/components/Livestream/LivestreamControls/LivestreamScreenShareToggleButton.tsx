import React, { useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  findNodeHandle,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ScreenShare } from '../../../icons/ScreenShare';
import { StopScreenShare } from '../../../icons/StopScreenShare';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { hasScreenShare, SfuModels } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useIsIosScreenshareBroadcastStarted } from '../../../hooks/useIsIosScreenshareBroadcastStarted';
import { usePrevious } from '../../../utils/hooks/usePrevious';

export type LivestreamScreenShareToggleButtonProps = {};

// ios >= 14.0 or android - platform restrictions
const CanDeviceScreenShare =
  (Platform.OS === 'ios' &&
    // @ts-ignore
    Number.parseInt(Platform.Version.split('.')[0], 10) >= 14) ||
  Platform.OS === 'android';

/**
 * The LivestreamVideoControlButton controls the screenshare stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamScreenShareToggleButton = () => {
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamScreenShareToggleButton,
    },
  } = useTheme();

  const call = useCall();
  const { useLocalParticipant, useCallSettings } = useCallStateHooks();
  const callSettings = useCallSettings();
  const isScreenSharingEnabledInCall = callSettings?.screensharing.enabled;

  const iosScreenShareStartedFromSystem = useIsIosScreenshareBroadcastStarted();
  const prevIosScreenShareStartedFromSystem = usePrevious(
    iosScreenShareStartedFromSystem,
  );

  const localParticipant = useLocalParticipant();
  const hasPublishedScreenShare =
    localParticipant && hasScreenShare(localParticipant);

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
          await call?.publishScreenShareStream(media);
        } catch (e) {
          // ignored.. user didnt allow the screen share in the popup
        }
      }
    } else if (hasPublishedScreenShare) {
      await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
    }
  };

  if (!isScreenSharingEnabledInCall || !CanDeviceScreenShare) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: hasPublishedScreenShare
            ? colors.error
            : colors.dark_gray,
          height: buttonSizes.xs,
          width: buttonSizes.xs,
        },
        livestreamScreenShareToggleButton.container,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            height: iconSizes.sm,
            width: iconSizes.sm,
          },
          livestreamScreenShareToggleButton.icon,
        ]}
      >
        {hasPublishedScreenShare ? (
          <StopScreenShare color={colors.static_white} />
        ) : (
          <ScreenShare color={colors.static_white} />
        )}
      </View>
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  icon: {},
});
