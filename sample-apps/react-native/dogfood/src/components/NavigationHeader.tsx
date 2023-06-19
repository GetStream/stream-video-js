import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  useI18n,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { A11yButtons } from '../constants/A11yLabels';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { appTheme } from '../theme';
import { AVATAR_SIZE } from '../constants';
import { Button } from './Button';

export const NavigationHeader = ({ route }: NativeStackHeaderProps) => {
  const videoClient = useStreamVideoClient();
  const { t } = useI18n();
  const username = useAppGlobalStoreValue((store) => store.username);
  const appStoreSetState = useAppGlobalStoreSetState();

  const logoutHandler = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
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
              username: '',
              userImageUrl: '',
              appMode: 'None',
            });
          } catch (error) {
            console.error('Failed to disconnect', error);
          }
        },
      },
    ]);
  };

  const showChooseModeButton =
    route.name === 'JoinMeetingScreen' || route.name === 'JoinCallScreen';

  return (
    <SafeAreaView style={styles.header}>
      <Pressable
        onPress={!showChooseModeButton ? undefined : logoutHandler}
        accessibilityLabel={A11yButtons.LOG_OUT_AVATAR}
      >
        <Text style={styles.headerText}>{username}</Text>
      </Pressable>
      {!showChooseModeButton ? (
        <Button onPress={logoutHandler} title="Logout" />
      ) : (
        <Button
          onPress={() => {
            appStoreSetState({ appMode: 'None' });
          }}
          title="Choose Mode"
          titleStyle={styles.buttonText}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.static_grey,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: appTheme.colors.static_white,
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
