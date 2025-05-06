import { useCall } from '@stream-io/video-react-bindings';
import { useState, useEffect, useMemo } from 'react';
import {
  Text,
  FlatList,
  Pressable,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../contexts';
import { ListRecordingsResponse } from '@stream-io/video-client';

export const CallEndedView = () => {
  const call = useCall();
  const [recordingsResponse, setRecordingsResponse] = useState<
    ListRecordingsResponse | undefined
  >(undefined);

  const styles = useStyles();

  useEffect(() => {
    const fetchRecordings = async () => {
      if (recordingsResponse === null) {
        try {
          const callRecordingsResponse = await call?.queryRecordings();
          setRecordingsResponse(callRecordingsResponse);
        } catch (error) {
          console.error('Error fetching recordings:', error);
          setRecordingsResponse(undefined);
        }
      }
    };

    fetchRecordings();
  }, [call, recordingsResponse]);

  const openUrl = (url: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log('Cannot open URL:', url);
      }
    });
  };

  const showRecordings =
    recordingsResponse && recordingsResponse.recordings.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>The livestream has ended.</Text>

      {showRecordings && (
        <>
          <Text style={styles.subtitle}>Watch recordings:</Text>
          <View style={styles.recordingsContainer}>
            <FlatList
              data={recordingsResponse.recordings}
              keyExtractor={(item) => item.session_id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.recordingButton}
                  onPress={() => openUrl(item.url)}
                >
                  <Text style={styles.recordingText}>{item.url}</Text>
                </Pressable>
              )}
            />
          </View>
        </>
      )}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.sheetPrimary,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.variants.spacingSizes.md,
        },
        title: {
          fontSize: theme.variants.fontSizes.lg,
          marginBottom: theme.variants.spacingSizes.md,
          color: theme.colors.textPrimary,
          fontWeight: 'bold',
        },
        subtitle: {
          fontSize: theme.variants.fontSizes.md,
          marginBottom: theme.variants.spacingSizes.md,
          color: theme.colors.textPrimary,
          fontWeight: 'bold',
        },
        recordingButton: {
          padding: theme.variants.spacingSizes.sm,
          width: '100%',
        },
        recordingText: {
          color: theme.colors.textSecondary,
          fontSize: theme.variants.fontSizes.md,
        },
        recordingsContainer: {
          width: '100%',
          alignItems: 'center',
        },
      }),
    [theme],
  );
};
