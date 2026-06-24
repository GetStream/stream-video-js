import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { appTheme } from '../../../theme';

export const PlaybackPanel = ({ uri }: { uri: string }) => {
  const styles = useStyles();

  const videoRef = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(true);
  const [ended, setEnded] = useState(false);

  const onPlayPress = () => {
    if (paused && ended) {
      videoRef.current?.seek(0);
      setEnded(false);
    }
    setPaused((p) => !p);
  };

  return (
    <View style={styles.panelContainer}>
      <View style={styles.videoPanel}>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          paused={paused}
          resizeMode="cover"
          repeat={false}
          onEnd={() => {
            setPaused(true);
            setEnded(true);
          }}
          onError={(e) => console.warn('Video playback error', e)}
        />
        <Pressable onPress={onPlayPress} style={styles.playOverlay}>
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
          ...StyleSheet.absoluteFill,
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
