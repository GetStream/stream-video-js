import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import {
  permissions,
  RTCCameraPreviewView,
} from '@stream-io/react-native-webrtc';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Props for the {@link LobbyCameraPreview} component.
 */
export type LobbyCameraPreviewProps = {
  /**
   * Resembles the CSS style object-fit.
   *
   * @default 'cover'
   */
  objectFit?: 'contain' | 'cover';
  /**
   * Style applied to the preview view.
   */
  style?: ViewStyle;
};

/**
 * The lobby runs before the call is joined. This component drives the native
 * camera capturer directly via {@link RTCCameraPreviewView} which requires
 * no track/peer connection factory to be created.
 *
 * It is driven by the *intended* camera state (optimistic): the lobby camera
 * toggle only updates `optimisticStatus`; the real WebRTC track is acquired and
 * published at join.
 */
export const LobbyCameraPreview = ({
  style,
  objectFit = 'cover',
}: LobbyCameraPreviewProps) => {
  const { useCameraState, useCallSettings } = useCallStateHooks();

  const { optimisticIsMute, direction, selectedDevice } = useCameraState();
  const settings = useCallSettings();

  const wantsCamera = !optimisticIsMute;
  const hasCameraPermission = useEnsureCameraPermission(wantsCamera);

  const facing = direction === 'back' ? 'back' : 'front';

  // Capture at the call's target resolution so the running preview capturer matches
  // what the track publishes and can be adopted at join without reconfiguring.
  // Normalize to landscape, matching CameraManager.selectTargetResolution.
  const targetResolution = settings?.video.target_resolution;
  let captureWidth = targetResolution?.width ?? 1280;
  let captureHeight = targetResolution?.height ?? 720;
  if (captureWidth < captureHeight) {
    [captureWidth, captureHeight] = [captureHeight, captureWidth];
  }

  return (
    <RTCCameraPreviewView
      style={[StyleSheet.absoluteFill, style as any]}
      isActive={wantsCamera && hasCameraPermission}
      facing={facing}
      deviceId={selectedDevice}
      mirror={Platform.OS === 'ios' ? true : facing === 'front'}
      objectFit={objectFit}
      captureWidth={captureWidth}
      captureHeight={captureHeight}
    />
  );
};

const useEnsureCameraPermission = (enabled: boolean): boolean => {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!enabled || granted) return;

    let cancelled = false;
    (async () => {
      try {
        const status = await permissions.query({ name: 'camera' });
        if (status === 'granted') {
          if (!cancelled) setGranted(true);
          return;
        }
        const result = await permissions.request({ name: 'camera' });
        if (!cancelled) setGranted(!!result);
      } catch {
        if (!cancelled) setGranted(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, granted]);

  return granted;
};
