import React, {useCallback} from 'react';
import {ActiveCall, useActiveCall} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationStackParamsList} from '../types';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native';
import {theme} from '@stream-io/video-react-native-sdk/dist/src/theme';

type ActiveCallScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'ActiveCallScreen'
>;

export function ActiveCallScreen({navigation}: ActiveCallScreenProps) {
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
