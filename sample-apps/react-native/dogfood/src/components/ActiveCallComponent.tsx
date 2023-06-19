import React, { useEffect } from 'react';
import { ActiveCall, useCall } from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { callkeepCallId$ } from '../hooks/useCallkeepEffect';
import {
  startForegroundService,
  stopForegroundService,
} from '../modules/push/android';
import { appTheme } from '../theme';

export const ActiveCallComponent = () => {
  const call = useCall();

  // effect to answer call when incoming call is received from callkeep
  useEffect(() => {
    const subscription = callkeepCallId$.subscribe((callkeepCallId) => {
      if (!callkeepCallId || !call) {
        return;
      }
      // TODO: check if callId is the same call as incoming call
      call.join();
      callkeepCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
    });
    return () => subscription.unsubscribe();
  }, [call]);

  useEffect(() => {
    if (!call) {
      return;
    }
    startForegroundService();
    return () => {
      stopForegroundService();
    };
  }, [call]);

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <SafeAreaView style={styles.wrapper}>
      <ActiveCall />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
});
