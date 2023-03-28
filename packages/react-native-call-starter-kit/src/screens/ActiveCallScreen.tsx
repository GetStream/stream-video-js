import React, {useCallback} from 'react';
import {ActiveCall, useActiveCall} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, SafeAreaView, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {theme} from '@stream-io/video-react-native-sdk/src/theme';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'ActiveCallScreen'
>;

export function ActiveCallScreen({navigation}: Props) {
  const activeCall = useActiveCall();

  const onOpenCallParticipantsInfoViewHandler = useCallback(() => {
    navigation.navigate('CallParticipantsInfoScreen');
  }, [navigation]);

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <SafeAreaView style={styles.wrapper}>
      <ActiveCall
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
});
