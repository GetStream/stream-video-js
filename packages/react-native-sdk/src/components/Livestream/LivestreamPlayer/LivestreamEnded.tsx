import React from 'react';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../../contexts';
import { ListRecordingsResponse } from '@stream-io/video-client';
import {
  FlatList,
  Pressable,
  View,
  Text,
  StyleSheet,
  Linking,
} from 'react-native';

export const CallEndedView = () => {
  const { t } = useI18n();
  const call = useCall();
  const [recordingsResponse, setRecordingsResponse] = useState<
    ListRecordingsResponse | undefined
  >(undefined);

  const styles = useStyles();

  useEffect(() => {
    let isCanceled = false;
    const fetchRecordings = async () => {
      if (recordingsResponse == null) {
        try {
          const callRecordingsResponse = await call?.queryRecordings();
          if (!isCanceled) {
            setRecordingsResponse(callRecordingsResponse);
          }
        } catch (error) {
          console.log('Error fetching recordings:', error);
          if (!isCanceled) {
            setRecordingsResponse(undefined);
          }
        }
      }
    };

    fetchRecordings();

    return () => {
      isCanceled = true;
    };
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
      <Text style={styles.title}>{t('The livestream has ended.')}</Text>

      {showRecordings && (
        <>
          <Text style={styles.subtitle}>{t('Watch recordings:')}</Text>
          <View style={styles.recordingsContainer}>
            <FlatList
              data={recordingsResponse.recordings}
              keyExtractor={(item) => item.session_id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.recordingButton}
                  onPress={() => openUrl(item.url)}
                >
                  <Text style={styles.recordingText}>
                    {item.url.substring(0, 70)}...
                  </Text>
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
