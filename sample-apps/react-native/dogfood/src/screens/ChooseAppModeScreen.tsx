import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { useOrientation } from '../hooks/useOrientation';
import { Button } from '@stream-io/video-react-native-sdk/src/components/utility/Button';
import { useAppI18n } from '../hooks/useAppI18n';

export const ChooseAppModeScreen = () => {
  const setState = useAppGlobalStoreSetState();
  const { t } = useAppI18n();
  const orientation = useOrientation();
  const styles = useStyles();
  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
  };

  const onAudioRoomSelect = () => {
    setState({ appMode: 'Audio-Room' });
  };

  const onLiveStreamSelect = () => {
    setState({ appMode: 'LiveStream' });
  };

  const onTestRecordingSelect = () => {
    setState({ appMode: 'TestRecording' });
  };

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
  };

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  return (
    <View style={[styles.container, landscapeStyles]}>
      <View style={styles.topContainer}>
        <Image source={require('../assets/Logo.png')} style={styles.logo} />
        <View>
          <Text style={styles.title}>
            {t('chooseAppMode.appName.title', 'Stream DogFood App')}
          </Text>
          <Text style={styles.subTitle}>
            {t('chooseAppMode.chooseMode.description', 'Choose the Mode')}
          </Text>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Button
          text={t('chooseAppMode.meeting.label', 'Meeting')}
          size="large"
          onPress={onMeetingSelect}
        />
        <Button
          text={t('chooseAppMode.call.label', 'Call')}
          size="large"
          onPress={onRingingSelect}
        />
        <Button
          text={t('chooseAppMode.audioRooms.label', 'Audio Rooms')}
          size="large"
          onPress={onAudioRoomSelect}
        />
        <Button
          text={t('chooseAppMode.livestreaming.label', 'Livestreaming')}
          size="large"
          onPress={onLiveStreamSelect}
        />
        <Button
          text={t('chooseAppMode.testRecording.label', 'Test Recording')}
          size="large"
          onPress={onTestRecordingSelect}
        />
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics, primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'space-evenly',
          backgroundColor: semantics.backgroundCoreApp,
          padding: primitives.spacingLg,
        },
        topContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        logo: {
          height: 100,
          width: 100,
          borderRadius: 20,
          alignSelf: 'center',
        },
        title: {
          fontSize: 30,
          color: semantics.textPrimary,
          fontWeight: '500',
          textAlign: 'center',
          marginTop: primitives.spacingLg,
        },
        subTitle: {
          color: semantics.textSecondary,
          fontSize: 16,
          textAlign: 'center',
          marginHorizontal: primitives.spacingXl,
        },
        bottomContainer: {
          flex: 1,
          justifyContent: 'center',
          gap: primitives.spacingSm,
        },
      }),
    [primitives, semantics],
  );
};
