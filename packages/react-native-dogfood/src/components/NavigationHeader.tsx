import React from 'react';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
    marginTop: 50,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  loginTitle: {
    marginTop: 50,
    marginBottom: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
});

export const NavigationHeader = (props: NativeStackHeaderProps) => {
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);

  const setState = useAppGlobalStoreSetState();

  const logoutHandler = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: () => {
          videoClient
            ?.disconnect()
            .then(() => {
              setState({
                videoClient: undefined,
                username: '',
                userImageUrl: '',
              });
              props.navigation.navigate('LoginScreen');
            })
            .catch((err) => {
              console.error('Failed to disconnect', err);
            });
        },
      },
    ]);
  };

  if (props.route.name === 'ActiveCall') {
    return null;
  } else if (props.route.name === 'LoginScreen') {
    return (
      <View style={styles.header}>
        <Text style={styles.loginTitle}>Login Screen</Text>
      </View>
    );
  }
  return (
    <View style={styles.header}>
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
