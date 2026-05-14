import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  RTCView,
  type MediaStream as RNMediaStream,
} from '@stream-io/react-native-webrtc';
import { appTheme } from '../../theme';
import { useCallStateHooks } from '@stream-io/video-react-native-sdk';

export const LoopbackPanel = ({
  loopbackVideoStream,
  loopbackAudioStream,
}: {
  loopbackVideoStream?: MediaStream;
  loopbackAudioStream: MediaStream;
}) => {
  const styles = useStyles();
  const { useCameraState } = useCallStateHooks();
  const { mediaStream: localVideoStream } = useCameraState();

  return (
    <View style={styles.panelContainer}>
      <View style={styles.statusRow}>
        <View style={styles.badge}>
          <View
            style={[
              styles.dot,
              loopbackAudioStream && { backgroundColor: '#4CAF50' },
            ]}
          />
          <Text style={styles.badgeText}>Audio loopback</Text>
        </View>
        <View style={styles.badge}>
          <View
            style={[
              styles.dot,
              loopbackVideoStream && { backgroundColor: '#4CAF50' },
            ]}
          />
          <Text style={styles.badgeText}>Video loopback</Text>
        </View>
      </View>

      <View style={styles.videoPanel}>
        {localVideoStream ? (
          <RTCView
            streamURL={(localVideoStream as unknown as RNMediaStream).toURL()}
            objectFit="cover"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.videoPanelPlaceholder}>
            <Text style={styles.placeholderText}>Waiting…</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        panelContainer: {
          flex: 1,
          gap: appTheme.spacing.md,
        },
        statusRow: {
          flexDirection: 'row',
          gap: appTheme.spacing.md,
        },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: appTheme.spacing.xs,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: appTheme.colors.disabled,
        },
        badgeText: {
          color: appTheme.colors.static_white,
          fontSize: 13,
        },
        videoPanel: {
          flex: 1,
          borderRadius: 8,
          backgroundColor: appTheme.colors.dark_gray,
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
          color: appTheme.colors.light_gray,
          fontSize: 13,
        },
        videoPanelLabelContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: appTheme.colors.static_overlay,
          paddingHorizontal: appTheme.spacing.sm,
          paddingVertical: appTheme.spacing.xs,
        },
        videoPanelLabel: {
          color: appTheme.colors.static_white,
          fontSize: 12,
        },
      }),
    [],
  );
};
