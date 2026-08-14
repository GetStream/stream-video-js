import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { appTheme } from '../../../theme';
import {
  ToggleCameraFaceButton,
  LobbyCameraPreview,
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

  return (
    <View style={styles.panelContainer}>
      <View style={styles.videoPanel}>
        {/*
         * Drives the native camera capturer directly, so it needs no local
         * track: on RN `camera.enable()` before JOINED only records the intent
         * and the real track is acquired when the join reconciles it. Used for
         * the whole run rather than only pre-join, so the self-view keeps a
         * consistent mirroring instead of flipping when recording starts.
         */}
        <LobbyCameraPreview style={StyleSheet.absoluteFill} />
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
            <Mic color={appTheme.colors.static_white} />
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
            <Video color={appTheme.colors.static_white} />
          </View>
        </View>
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
          position: 'absolute',
          right: 0,
          bottom: 0,
          paddingHorizontal: appTheme.spacing.md,
          paddingVertical: appTheme.spacing.sm,
          borderTopLeftRadius: appTheme.spacing.md,
          backgroundColor: appTheme.colors.static_overlay,
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
        iconContainer: {
          width: 12,
          height: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        videoPanel: {
          flex: 1,
          borderRadius: 8,
          backgroundColor: appTheme.colors.dark_gray,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
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
        toggleCameraFaceButton: {
          position: 'absolute',
          bottom: 12,
          left: 16,
        },
      }),
    [],
  );
};
