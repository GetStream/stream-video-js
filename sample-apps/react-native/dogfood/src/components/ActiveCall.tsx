import React, { useCallback, useEffect, useState } from 'react';
import { useCall, CallContent } from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParticipantsInfoList } from './ParticipantsInfoList';
import {
  CallControlsComponent,
  CallControlsComponentProps,
} from './CallControlls/CallControlsComponent';
import { useOrientation } from '../hooks/useOrientation';

type ActiveCallProps = CallControlsComponentProps & {
  onBackPressed?: () => void;
  onCallEnded: () => void;
};

export const ActiveCall = ({
  onChatOpenHandler,
  onBackPressed,
  onCallEnded,
  unreadCountIndicator,
}: ActiveCallProps) => {
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);
  const call = useCall();
  const currentOrientation = useOrientation();

  const onOpenCallParticipantsInfo = useCallback(() => {
    setIsCallParticipantsVisible(true);
  }, []);

  useEffect(() => {
    return call?.on('call.ended', () => {
      onCallEnded();
    });
  }, [call, onCallEnded]);

  const CustomControlsComponent = useCallback(() => {
    return (
      <CallControlsComponent
        onParticipantInfoPress={onOpenCallParticipantsInfo}
        onChatOpenHandler={onChatOpenHandler}
        unreadCountIndicator={unreadCountIndicator}
      />
    );
  }, [onChatOpenHandler, onOpenCallParticipantsInfo, unreadCountIndicator]);

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CallContent
        onBackPressed={onBackPressed}
        CallControls={CustomControlsComponent}
        landscape={currentOrientation === 'landscape'}
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
