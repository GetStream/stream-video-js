import React from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';

export const ChooseAppModeScreen = () => {
  const setState = useAppGlobalStoreSetState();

  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
  };

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.container]}>
      <Button title="Meeting" onPress={onMeetingSelect} />
      <View style={styles.separator} />
      <Button title="Call" onPress={onRingingSelect} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  separator: {
    marginTop: 10,
  },
});
