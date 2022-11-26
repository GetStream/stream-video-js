import React from 'react';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';

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
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const { logout } = useAuth();

  const logoutHandler = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: logout,
      },
    ]);
  };

  if (
    props.route.name === 'ActiveCall' ||
    props.route.name === 'IncomingCallScreen' ||
    props.route.name === 'OutgoingCallScreen'
  ) {
    return null;
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
