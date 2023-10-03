import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';
import { useI18n } from '@stream-io/video-react-native-sdk';
import { useOrientation } from '../hooks/useOrientation';

export const ChooseAppModeScreen = () => {
  const setState = useAppGlobalStoreSetState();
  const { t } = useI18n();
  const orientation = useOrientation();

  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
  };

  const onAudioRoomSelect = () => {
    setState({ appMode: 'Audio-Room' });
  };

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
  };

  const landScapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  return (
    <View style={[styles.container, landScapeStyles]}>
      <View style={styles.topContainer}>
        <Image source={require('../assets/Logo.png')} style={styles.logo} />
        <View>
          <Text style={styles.title}>{t('Stream DogFood App')}</Text>
          <Text style={styles.subTitle}>{t('Choose the Mode')}</Text>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Button title={t('Meeting')} onPress={onMeetingSelect} />
        <Button
          title={t('Call')}
          onPress={onRingingSelect}
          buttonStyle={styles.callButton}
        />
        <Button
          title={t('Audio Rooms')}
          onPress={onAudioRoomSelect}
          buttonStyle={styles.callButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    backgroundColor: appTheme.colors.static_grey,
    padding: appTheme.spacing.lg,
  },
  topContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  callButton: {
    marginTop: appTheme.spacing.md,
  },
  logo: {
    height: 100,
    width: 100,
    borderRadius: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 30,
    color: appTheme.colors.static_white,
    fontWeight: '500',
    textAlign: 'center',
  },
  subTitle: {
    color: appTheme.colors.light_gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: appTheme.spacing.lg,
    marginHorizontal: appTheme.spacing.xl,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
