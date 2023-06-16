import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  useI18n,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { A11yButtons } from '../constants/A11yLabels';
import { SafeAreaView } from 'react-native-safe-area-context';

export const NavigationHeader = () => {
  const videoClient = useStreamVideoClient();
  const { t } = useI18n();
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const appStoreSetState = useAppGlobalStoreSetState();

  const logoutHandler = () => {
    Alert.alert(
      `Sign out as ${username}`,
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
                username: '',
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

  return (
    <SafeAreaView style={styles.header}>
      <Pressable
        onPress={logoutHandler}
        accessibilityLabel={A11yButtons.LOG_OUT_AVATAR}
      >
        {!!userImageUrl && (
          <Image
            source={{
              uri: userImageUrl,
            }}
            style={styles.avatar}
          />
        )}
      </Pressable>
      <Pressable
        onPress={() => {
          appStoreSetState({ appMode: 'None' });
        }}
      >
        <Text style={styles.chooseAppMode}>Choose Mode</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  unset: {
    color: 'purple',
    fontWeight: 'bold',
  },
  chooseAppMode: {
    fontWeight: 'bold',
  },
});
