import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';
import { appTheme } from '../../theme';

export const PlaybackPanel = ({ uri }: { uri: string }) => {
  const styles = useStyles();

  const [paused, setPaused] = useState(true);

  return (
    <View style={styles.panelContainer}>
      <View style={styles.videoPanel}>
        <Video
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          paused={paused}
          resizeMode="contain"
          repeat={false}
          onEnd={() => setPaused(true)}
          onError={(e) => console.warn('Video playback error', e)}
        />
        <Pressable
          onPress={() => setPaused((p) => !p)}
          style={styles.playOverlay}
        >
          <View style={styles.playButton}>
            <Text style={styles.playButtonGlyph}>{paused ? '▶' : '❚❚'}</Text>
          </View>
        </Pressable>
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
        playOverlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          alignItems: 'center',
        },
        playButton: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        playButtonGlyph: {
          color: appTheme.colors.static_white,
          fontSize: 24,
          marginLeft: 2,
        },
      }),
    [],
  );
};
