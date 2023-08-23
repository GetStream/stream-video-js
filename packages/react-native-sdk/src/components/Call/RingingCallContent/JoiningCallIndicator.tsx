import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts';

export const JoiningCallIndicator = () => {
  const {
    theme: { colors, joiningCallIndicator },
  } = useTheme();
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.static_grey },
        joiningCallIndicator.container,
      ]}
    >
      <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
