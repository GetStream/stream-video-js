import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Button, SafeAreaView, StyleSheet } from 'react-native';
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
        navigation.navigate('Meeting', { screen: 'MeetingScreen' });
      }
    });
    return () => subscription.unsubscribe();
  }, [setState, navigation]);

  const onMeetingSelect = () => {
    navigation.navigate('Meeting', {
      screen: 'JoinMeetingScreen',
    });
  };
  const onRingingSelect = () => {
    navigation.navigate('Ringing', {
      screen: 'JoinCallScreen',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Meeting" onPress={onMeetingSelect} />
      <Button title="Ringing" onPress={onRingingSelect} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});
