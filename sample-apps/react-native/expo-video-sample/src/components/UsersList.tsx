import React, { useCallback, useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { users } from '../data/users';
import { useAppContext } from '../context/AppContext';
import { UserType } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export const UsersList = () => {
  const { loginHandler } = useAppContext();

  const moveToCallLobby = useCallback(
    (user: UserType) => {
      AsyncStorage.setItem('my-user', JSON.stringify(user));
      loginHandler({ ...user, image: user.imageUrl });
    },
    [loginHandler],
  );

  useEffect(() => {
    AsyncStorage.getItem('my-user').then((userJson) => {
      const user = userJson && JSON.parse(userJson);
      if (user) {
        loginHandler({ ...user, image: user.imageUrl });
      }
    });
  }, [loginHandler]);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.chooseText}>Choose your user:</Text>
        {users.map((user) => {
          return (
            <Pressable
              style={styles.user}
              key={user.id}
              onPress={() => moveToCallLobby(user)}
            >
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.arrow}>►</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {},
  chooseText: {
    textAlign: 'center',
    fontSize: 40,
    color: '#52be80',
    marginBottom: 20,
  },
  user: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  avatar: {
    height: 60,
    width: 60,
    borderRadius: 60,
  },
  name: {
    marginLeft: 20,
    fontSize: 20,
  },
  arrow: {
    fontSize: 25,
    position: 'absolute',
    right: 20,
  },
});
