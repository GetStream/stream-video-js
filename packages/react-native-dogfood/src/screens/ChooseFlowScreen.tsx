import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { LoginStackParamList } from '../../types';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';

type Props = NativeStackScreenProps<LoginStackParamList, 'ChooseFlowScreen'>;

export const ChooseFlowScreen = (props: Props) => {
  const { navigation } = props;
  const setState = useAppGlobalStoreSetState();

  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
    navigation.navigate('LoginScreen');
  };

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
    navigation.navigate('LoginScreen');
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
