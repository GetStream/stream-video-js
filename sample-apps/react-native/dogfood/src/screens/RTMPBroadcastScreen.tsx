import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Broadcast,
  BroadcastVideoView,
} from '@stream-io/video-react-native-broadcast';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';

const RTMP_ENDPOINT =
  'rtmps://ingress.stream-io-video.com:443/par8f5s3gn2j.default.RdcC9Qr4j7pzr62FZbo8Q';
const RTMP_STREAM_NAME =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL2phbmUiLCJ1c2VyX2lkIjoiamFuZSIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiZW52aXJvbm1lbnQiOiJwcm9udG8iLCJpYXQiOjE3NjA5Njc0MzMsImV4cCI6MTc2MTU3MjIzM30.pkBwlOMlo7wUJG4DSG7fk8QAxF912Y5UaErm4H6a59I';

export const RTMPBroadcastScreen = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraDirection, setCameraDirection] = useState<'front' | 'back'>(
    'front',
  );
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const broadcast = useMemo(() => Broadcast.create(), []);
  useEffect(() => {
    return () => {
      broadcast.stop().then(() => broadcast.destroy());
    };
  }, [broadcast]);

  const startBroadcast = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[RTMP] Starting broadcast...');

      await broadcast.start(RTMP_ENDPOINT, RTMP_STREAM_NAME);
      setIsBroadcasting(true);
    } catch (err) {
      console.error('[RTMP] Failed to start broadcast:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to start broadcast',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stopBroadcast = async () => {
    try {
      setIsLoading(true);
      await broadcast.stop();
      setIsBroadcasting(false);
    } catch (err) {
      console.error('[RTMP] Failed to stop broadcast:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop broadcast');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = async () => {
    try {
      const next = !cameraEnabled;
      setCameraEnabled(next);
      broadcast?.setCameraEnabled(next);
    } catch (err) {
      console.error('[RTMP] Failed to toggle camera:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle camera');
    }
  };

  const toggleMicrophone = async () => {
    try {
      const next = !microphoneEnabled;
      setMicrophoneEnabled(next);
      broadcast?.setMicrophoneEnabled(next);
    } catch (err) {
      console.error('[RTMP] Failed to toggle microphone:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to toggle microphone',
      );
    }
  };

  const switchCamera = async () => {
    try {
      const next = cameraDirection === 'front' ? 'back' : 'front';
      setCameraDirection(next);
      broadcast?.setCameraDirection(next);
    } catch (err) {
      console.error('[RTMP] Failed to switch camera:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch camera');
    }
  };

  const styles = useStyles(themeMode);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'}
      />

      <View style={styles.header}>
        <Text style={styles.title}>RTMP Broadcast</Text>
        {isBroadcasting && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.videoContainer}>
        {isBroadcasting ? (
          <BroadcastVideoView broadcast={broadcast} style={styles.video} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {isLoading
                ? 'Initializing broadcast...'
                : 'Tap "Start Broadcast" to begin'}
            </Text>
            {isLoading && (
              <ActivityIndicator size="large" color={appTheme.colors.primary} />
            )}
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.controls}>
        {!isBroadcasting && (
          <Button
            title="Start Broadcast"
            onPress={startBroadcast}
            disabled={isLoading}
          />
        )}
        {isBroadcasting && (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>Broadcasting to RTMP server</Text>
              <Text style={styles.infoSubText}>Stream is live</Text>
            </View>
            <View style={{ height: 12 }} />
            <Button
              title={cameraEnabled ? 'Mute Camera' : 'Unmute Camera'}
              onPress={toggleCamera}
              disabled={isLoading}
            />
            <View style={{ height: 8 }} />
            <Button
              title={
                microphoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'
              }
              onPress={toggleMicrophone}
              disabled={isLoading}
            />
            <View style={{ height: 8 }} />
            <Button
              title={`Switch Camera (${cameraDirection === 'front' ? 'Back' : 'Front'})`}
              onPress={switchCamera}
              disabled={isLoading}
            />
            <View style={{ height: 8 }} />
            <Button
              title="Stop Broadcast"
              onPress={stopBroadcast}
              disabled={isLoading}
            />
          </>
        )}
      </View>
    </View>
  );
};

const useStyles = (themeMode: 'light' | 'dark') => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        themeMode === 'light'
          ? appTheme.colors.static_white
          : appTheme.colors.static_grey,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: 60,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color:
        themeMode === 'light'
          ? appTheme.colors.dark_gray
          : appTheme.colors.static_white,
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF0000',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: appTheme.colors.static_white,
      marginRight: 6,
    },
    liveText: {
      color: appTheme.colors.static_white,
      fontWeight: 'bold',
      fontSize: 14,
    },
    videoContainer: {
      flex: 1,
      margin: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: appTheme.colors.dark_gray,
    },
    video: {
      flex: 1,
    },
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    placeholderText: {
      color: appTheme.colors.static_white,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    controls: {
      padding: 16,
      paddingBottom: 32,
    },
    errorContainer: {
      backgroundColor: '#FF000020',
      padding: 12,
      marginHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FF0000',
    },
    errorText: {
      color: '#FF0000',
      fontSize: 14,
      textAlign: 'center',
    },
    infoContainer: {
      alignItems: 'center',
      gap: 4,
    },
    infoText: {
      color:
        themeMode === 'light'
          ? appTheme.colors.dark_gray
          : appTheme.colors.static_white,
      fontSize: 16,
      fontWeight: '600',
    },
    infoSubText: {
      color: themeMode === 'light' ? '#666' : '#999',
      fontSize: 14,
    },
  });
};
