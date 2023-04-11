import {Pressable, PressableProps, StyleSheet, Text} from 'react-native';
import React from 'react';

export default ({
  onPress,
  text,
  style = {},
}: {
  onPress: () => any;
  text: string;
  style?: PressableProps['style'];
}) => {
  return (
    <Pressable
      style={[styles.pressableContainer, style as Object]}
      onPress={onPress}>
      <Text style={styles.pressableText}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    backgroundColor: '#000',
    padding: 8,
    marginBottom: 4,
  },
  pressableText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
