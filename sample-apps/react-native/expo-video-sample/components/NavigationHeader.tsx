import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

export const NavigationHeader = () => {
  const { user, logoutHandler } = useAppContext();
  const { top } = useSafeAreaInsets();

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
    <View style={[styles.header, { paddingTop: top }]}>
      <TouchableOpacity style={styles.user} onPress={logout}>
        <Image
          source={{
            uri: user?.image,
          }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user?.name}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
    marginVertical: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
