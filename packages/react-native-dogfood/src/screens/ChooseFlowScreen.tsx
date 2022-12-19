import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '../../types';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { prontoCallId$ } from '../hooks/useProntoLinkEffect';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseFlowScreen'>;

export const ChooseFlowScreen = (props: Props) => {
  const { navigation } = props;
  const setState = useAppGlobalStoreSetState();

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({
          meetingCallID: prontoCallId,
        });
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
        setState({ appMode: 'Meeting' });
      }
    });
    return () => subscription.unsubscribe();
  }, [setState, navigation]);

  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
  };
  const onRingingSelect = () => {
    setState({ appMode: 'Ringing' });
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.container]}>
      <Button title="Meeting" onPress={onMeetingSelect} />
      <View style={styles.separator} />
      <Button title="Ringing" onPress={onRingingSelect} />
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
