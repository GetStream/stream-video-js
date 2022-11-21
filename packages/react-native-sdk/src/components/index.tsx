import React from 'react';
import { Pressable, Text, View } from 'react-native';

export const HelloWorld = () => (
  <View style={{ width: 100, height: 100, backgroundColor: 'red' }}>
    <Pressable onPress={() => console.log('hello')}>
      <Text>Hello World!</Text>
    </Pressable>
  </View>
);
