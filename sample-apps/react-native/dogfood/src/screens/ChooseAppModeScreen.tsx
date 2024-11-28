import React, { useMemo } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';
import { useI18n, useTheme } from '@stream-io/video-react-native-sdk';
import { useOrientation } from '../hooks/useOrientation';

export const ChooseAppModeScreen = () => {
  const setState = useAppGlobalStoreSetState();
  const { t } = useI18n();
  const orientation = useOrientation();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
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

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
  };

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  return (
    <View style={[styles.container, landscapeStyles]}>
      <StatusBar
        barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'}
      />
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
        <Button
          title={t('Live streaming')}
          onPress={onLiveStreamSelect}
          buttonStyle={styles.callButton}
        />
      </View>
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
          justifyContent: 'space-evenly',
          backgroundColor: theme.colors.sheetPrimary,
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
          color: theme.colors.textPrimary,
          fontWeight: '500',
          textAlign: 'center',
          marginTop: appTheme.spacing.lg,
        },
        subTitle: {
          color: theme.colors.textSecondary,
          fontSize: 16,
          textAlign: 'center',
          marginHorizontal: appTheme.spacing.xl,
        },
        bottomContainer: {
          flex: 1,
          justifyContent: 'center',
        },
      }),
    [theme],
  );
};
