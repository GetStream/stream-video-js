import React from 'react';
import { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

export const IconWrapper = ({ children }: { children: ReactNode }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
