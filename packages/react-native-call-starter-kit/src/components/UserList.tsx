import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import users from '../data/users.json';
import {useAppContext} from '../context/AppContext';

export const UserList = () => {
  const {loginHandler} = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.chooseText}>Choose your user:</Text>
      {users.map(user => {
        return (
          <Pressable
            style={styles.user}
            key={user.id}
            onPress={() => {
              loginHandler({
                userId: user.id,
                userImageUrl: user.image,
                userToken: user.token,
              });
            }}>
            <Image source={{uri: user.image}} style={styles.avatar} />
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.arrow}>►</Text>
          </Pressable>
        );
      })}
    </View>
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
