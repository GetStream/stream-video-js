import React from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useAppContext} from '../context/AppContext';

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
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
  const {user, logoutHandler} = useAppContext();

  const logout = () => {
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
            logoutHandler();
          } catch (error) {
            console.error('Failed to disconnect', error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.header}>
      <Image
        source={{
          uri: user?.image,
        }}
        style={styles.avatar}
      />
      <Pressable onPress={logout}>
        <Text style={styles.unset}>Logout</Text>
      </Pressable>
    </View>
  );
};
