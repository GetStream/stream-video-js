import React, { useCallback, useState } from 'react';
import { useCall, CallContent } from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParticipantsInfoList } from './ParticipantsInfoList';
import {
  CallControlsComponent,
  CallControlsComponentProps,
} from './CallControlsComponent';

type ActiveCallProps = CallControlsComponentProps & {
  onBackPressed?: () => void;
};

export const ActiveCall = ({
  chatButton,
  onBackPressed,
  onHangupCallHandler,
}: ActiveCallProps) => {
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);
  const call = useCall();

  const onOpenCallParticipantsInfo = () => {
    setIsCallParticipantsVisible(true);
  };

  const CustomControlsComponent = useCallback(() => {
    return (
      <CallControlsComponent
        onHangupCallHandler={onHangupCallHandler}
        chatButton={chatButton}
      />
    );
  }, [chatButton, onHangupCallHandler]);

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CallContent
        onBackPressed={onBackPressed}
        onParticipantInfoPress={onOpenCallParticipantsInfo}
        CallControls={CustomControlsComponent}
      />
      <ParticipantsInfoList
        isCallParticipantsInfoVisible={isCallParticipantsVisible}
        setIsCallParticipantsInfoVisible={setIsCallParticipantsVisible}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
