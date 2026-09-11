import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts';
import { ListRecordingsResponse } from '@stream-io/video-client';
import {
  FlatList,
  Linking,
  type ListRenderItem,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

type RecordingItem = ListRecordingsResponse['recordings'][number];

type RecordingRowProps = {
  recording: RecordingItem;
  onPress: (url: string) => void;
  buttonStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

const RecordingRow = React.memo(
  ({ recording, onPress, buttonStyle, textStyle }: RecordingRowProps) => {
    const handlePress = useCallback(
      () => onPress(recording.url),
      [onPress, recording.url],
    );
    return (
      <Pressable style={buttonStyle} onPress={handlePress}>
        <Text style={textStyle}>{recording.url.substring(0, 70)}...</Text>
      </Pressable>
    );
  },
);

RecordingRow.displayName = 'RecordingRow';

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

  const openUrl = useCallback((url: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log('Cannot open URL:', url);
      }
    });
  }, []);

  const keyExtractor = useCallback(
    (item: RecordingItem) => item.session_id,
    [],
  );

  const renderItem = useCallback<ListRenderItem<RecordingItem>>(
    ({ item }) => (
      <RecordingRow
        recording={item}
        onPress={openUrl}
        buttonStyle={styles.recordingButton}
        textStyle={styles.recordingText}
      />
    ),
    [openUrl, styles.recordingButton, styles.recordingText],
  );

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
              keyExtractor={keyExtractor}
              renderItem={renderItem}
            />
          </View>
        </>
      )}
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
        container: {
          flex: 1,
          backgroundColor: semantics.backgroundCoreApp,
          justifyContent: 'center',
          alignItems: 'center',
          padding: primitives.spacingMd,
        },
        title: {
          fontSize: primitives.typographyFontSizeLg,
          marginBottom: primitives.spacingMd,
          color: semantics.textPrimary,
          fontWeight: primitives.typographyFontWeightBold,
        },
        subtitle: {
          fontSize: primitives.typographyFontSizeMd,
          marginBottom: primitives.spacingMd,
          color: semantics.textPrimary,
          fontWeight: primitives.typographyFontWeightBold,
        },
        recordingButton: {
          padding: primitives.spacingSm,
          width: '100%',
        },
        recordingText: {
          color: semantics.textSecondary,
          fontSize: primitives.typographyFontSizeMd,
        },
        recordingsContainer: {
          width: '100%',
          alignItems: 'center',
        },
      }),
    [primitives, semantics],
  );
};
