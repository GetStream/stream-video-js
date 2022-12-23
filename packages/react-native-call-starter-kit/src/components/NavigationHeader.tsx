import React from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../context/AppContext';

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
  const setState = useAppGlobalStoreSetState();
  const userImageUrl = useAppGlobalStoreValue(store => store.userImageUrl);

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
            setState({userId: '', userToken: '', userImageUrl: ''});
          } catch (error) {
            console.error('Failed to disconnect', error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.header}>
      {!!userImageUrl && (
        <Image
          source={{
            uri: userImageUrl,
          }}
          style={styles.avatar}
        />
      )}
      <Pressable onPress={logoutHandler}>
        <Text style={styles.unset}>Logout</Text>
      </Pressable>
    </View>
  );
};
