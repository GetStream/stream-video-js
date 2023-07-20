import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  useI18n,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { appTheme } from '../theme';
import { AVATAR_SIZE } from '../constants';
import { Button } from './Button';
import { A11yButtons } from '../constants/A11yLabels';

export const NavigationHeader = ({ route }: NativeStackHeaderProps) => {
  const videoClient = useStreamVideoClient();
  const { t } = useI18n();
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const appStoreSetState = useAppGlobalStoreSetState();

  const logoutHandler = () => {
    Alert.alert(
      `Sign out as ${userName}`,
      'Are you sure you want to sign out?',
      [
        {
          text: t('Cancel'),
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await Promise.all([
                GoogleSignin.signOut(),
                videoClient?.disconnectUser(),
              ]);

              appStoreSetState({
                userId: '',
                userName: '',
                userImageUrl: '',
                appMode: 'None',
              });
            } catch (error) {
              console.error('Failed to disconnect', error);
            }
          },
        },
      ],
    );
  };

  const showChooseModeButton =
    route.name === 'JoinMeetingScreen' || route.name === 'JoinCallScreen';

  return (
    <SafeAreaView style={styles.header} edges={['top']}>
      <Text style={styles.headerText} numberOfLines={1}>
        {userName}
      </Text>
      {!showChooseModeButton ? (
        <Button
          onPress={logoutHandler}
          title={t('Logout')}
          accessibilityLabel={A11yButtons.LOG_OUT}
        />
      ) : (
        <Button
          onPress={() => {
            appStoreSetState({ appMode: 'None' });
          }}
          title={t('Choose Mode')}
          titleStyle={styles.buttonText}
          accessibilityLabel={A11yButtons.CHOOSE_MODE}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.static_grey,
  },
  headerText: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '500',
    color: appTheme.colors.static_white,
    marginRight: appTheme.spacing.lg,
  },
  avatar: {
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    borderRadius: 50,
  },
  chooseAppMode: {
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 12,
  },
});
