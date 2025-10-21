import React, { useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BroadcastVideoView,
  multiply,
} from '@stream-io/video-react-native-broadcast';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';

export const RTMPBroadcastScreen = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);

  const startBroadcast = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[RTMP] Starting broadcast...');

      const result = await multiply(3, 7);
      console.log(`[RTMP] Broadcast started with result: ${result}`);

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
          <BroadcastVideoView style={styles.video} />
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
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Broadcasting to RTMP server</Text>
            <Text style={styles.infoSubText}>Stream is live</Text>
          </View>
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
