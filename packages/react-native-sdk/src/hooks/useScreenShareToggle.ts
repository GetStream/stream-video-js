import React, { useRef, useEffect } from 'react';
import { Platform, findNodeHandle, NativeModules } from 'react-native';
import { useIsIosScreenshareBroadcastStarted } from '.';
import { usePrevious } from '../utils/hooks';
import { SfuModels } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

// ios >= 14.0 or android
const CanDeviceScreenShare =
  (Platform.OS === 'ios' &&
    // @ts-ignore
    Number.parseInt(Platform.Version.split('.')[0], 10) >= 14) ||
  Platform.OS === 'android';

type Callbacks = {
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

type ReturnType = {
  onPress: () => Promise<void>;
  /**
   *  The ref to be passed to ScreenCapturePickerView component
   * */
  screenCapturePickerViewiOSRef: React.MutableRefObject<null>;
  isScreenSharingEnabledInCall: boolean | undefined;
  isScreenSharingAccessRequestEnabled: boolean | undefined;
  CanDeviceScreenShare: boolean;
};

const useScreenShareToggle = ({
  onScreenShareStartedHandler,
  onScreenShareStoppedHandler,
}: Callbacks = {}): ReturnType => {
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

  const screenCapturePickerViewiOSRef = React.useRef(null);

  const onPress = async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCapturePickerViewiOSRef.current);
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

  return {
    screenCapturePickerViewiOSRef,
    onPress,
    isScreenSharingEnabledInCall,
    isScreenSharingAccessRequestEnabled,
    CanDeviceScreenShare,
  };
};

export default useScreenShareToggle;
