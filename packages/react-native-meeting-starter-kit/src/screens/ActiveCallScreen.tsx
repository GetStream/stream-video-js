import React, {useCallback} from 'react';
import {
  ActiveCall,
  StreamVideoRN,
  useCall,
} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {NavigationStackParamsList} from '../types';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '@stream-io/video-react-native-sdk/src/theme';

type ActiveCallScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'ActiveCallScreen'
>;

export function ActiveCallScreen({navigation}: ActiveCallScreenProps) {
  const activeCall = useCall();
  const insets = useSafeAreaInsets();

  const onOpenCallParticipantsInfoViewHandler = useCallback(() => {
    navigation.navigate('CallParticipantsInfoScreen');
  }, [navigation]);

  StreamVideoRN.setConfig({
    onOpenCallParticipantsInfoView: onOpenCallParticipantsInfoViewHandler,
  });

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <View style={[styles.wrapper, {paddingTop: insets.top}]}>
      <ActiveCall />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
});
