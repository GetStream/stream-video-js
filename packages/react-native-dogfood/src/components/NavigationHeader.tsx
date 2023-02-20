import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 50,
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
});

export const NavigationHeader = () => {
  const videoClient = useStreamVideoClient();
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const appStoreSetState = useAppGlobalStoreSetState();

  const logoutHandler = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
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
            });
          } catch (error) {
            console.error('Failed to disconnect', error);
          }
        },
      },
    ]);
  };

  const modeUnsetHandler = () => {
    appStoreSetState({ appMode: 'None' });
  };

  return (
    <View style={styles.header}>
      <Pressable onPress={modeUnsetHandler}>
        <Text style={styles.unset}>Unset Mode</Text>
      </Pressable>
      <Pressable onPress={logoutHandler}>
        {!!userImageUrl && (
          <Image
            source={{
              uri: userImageUrl,
            }}
            style={styles.avatar}
          />
        )}
      </Pressable>
    </View>
  );
};
