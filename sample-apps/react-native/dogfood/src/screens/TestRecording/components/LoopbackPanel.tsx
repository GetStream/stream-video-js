import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  RTCView,
  type MediaStream as RNMediaStream,
} from '@stream-io/react-native-webrtc';
import {
  useCallStateHooks,
  ToggleCameraFaceButton,
  LobbyCameraPreview,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { Mic } from '../../../assets/Mic';
import { Video } from '../../../assets/Video';

export const LoopbackPanel = ({
  loopbackVideoStream,
  loopbackAudioStream,
}: {
  loopbackVideoStream?: MediaStream;
  loopbackAudioStream?: MediaStream;
}) => {
  const styles = useStyles();
  const { useCameraState } = useCallStateHooks();
  const { mediaStream: localVideoStream } = useCameraState();

  return (
    <View style={styles.panelContainer}>
      <View style={styles.videoPanel}>
        {localVideoStream ? (
          <RTCView
            streamURL={(localVideoStream as unknown as RNMediaStream).toURL()}
            objectFit="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LobbyCameraPreview style={StyleSheet.absoluteFill} />
        )}
      </View>

      <View style={styles.toggleCameraFaceButton}>
        <ToggleCameraFaceButton />
      </View>

      <View style={styles.statusRow}>
        <View style={styles.badge}>
          <View
            style={[
              styles.dot,
              loopbackAudioStream && { backgroundColor: '#4CAF50' },
            ]}
          />
          <View style={styles.iconContainer}>
            <Mic color={styles.icon.color} />
          </View>
        </View>
        <View style={styles.badge}>
          <View
            style={[
              styles.dot,
              loopbackVideoStream && { backgroundColor: '#4CAF50' },
            ]}
          />
          <View style={styles.iconContainer}>
            <Video color={styles.icon.color} />
          </View>
        </View>
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        panelContainer: {
          flex: 1,
          gap: primitives.spacingMd,
        },
        statusRow: {
          position: 'absolute',
          right: primitives.spacingMd,
          bottom: primitives.spacingXs,
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingSm,
          borderRadius: primitives.spacingSm,
          backgroundColor: semantics.backgroundCoreScrim,
          flexDirection: 'row',
          gap: primitives.spacingMd,
        },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingXs,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: semantics.backgroundUtilityDisabled,
        },
        iconContainer: {
          width: 12,
          height: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        videoPanel: {
          flex: 1,
          borderRadius: primitives.radiusLg,
          backgroundColor: semantics.backgroundCoreApp,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        videoPanelPlaceholder: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        placeholderText: {
          color: semantics.textSecondary,
          fontSize: 13,
        },
        videoPanelLabelContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: semantics.backgroundCoreApp,
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingXs,
        },
        videoPanelLabel: {
          color: semantics.textPrimary,
          fontSize: 12,
        },
        toggleCameraFaceButton: {
          position: 'absolute',
          bottom: 12,
          left: 16,
        },
        icon: {
          color: semantics.textOnAccent,
        },
      }),
    [primitives, semantics],
  );
};
