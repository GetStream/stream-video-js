import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';
import { useI18n } from '@stream-io/video-react-native-sdk';

export const ChooseAppModeScreen = () => {
  const setState = useAppGlobalStoreSetState();
  const { t } = useI18n();

  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
  };

  const onAudioRoomSelect = () => {
    setState({ appMode: 'Audio-Room' });
  };

  const onLiveStreamSelect = () => {
    setState({ appMode: 'LiveStream' });
  };

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Logo.png')} style={styles.logo} />
      <View>
        <Text style={styles.title}>{t('Stream DogFood App')}</Text>
        <Text style={styles.subTitle}>{t('Choose the Mode')}</Text>
      </View>
      <View>
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
        <Button
          title={t('Live streaming')}
          onPress={onLiveStreamSelect}
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
});
