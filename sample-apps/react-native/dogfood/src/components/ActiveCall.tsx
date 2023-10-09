import React, { useCallback, useState } from 'react';
import {
  useCall,
  CallContent,
  CallControlProps,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParticipantsInfoList } from './ParticipantsInfoList';
import {
  CallControlsComponent,
  CallControlsComponentProps,
} from './CallControlsComponent';
import { useOrientation } from '../hooks/useOrientation';

type ActiveCallProps = CallControlsComponentProps & {
  onBackPressed?: () => void;
};

export const ActiveCall = ({
  onChatOpenHandler,
  onBackPressed,
  onHangupCallHandler,
  unreadCountIndicator,
}: ActiveCallProps) => {
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);
  const call = useCall();
  const currentOrientation = useOrientation();

  const onOpenCallParticipantsInfo = () => {
    setIsCallParticipantsVisible(true);
  };

  const CustomControlsComponent = useCallback(
    ({ landscape }: CallControlProps) => {
      return (
        <CallControlsComponent
          onHangupCallHandler={onHangupCallHandler}
          onChatOpenHandler={onChatOpenHandler}
          unreadCountIndicator={unreadCountIndicator}
          landscape={landscape}
        />
      );
    },
    [onChatOpenHandler, onHangupCallHandler, unreadCountIndicator],
  );

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CallContent
        onBackPressed={onBackPressed}
        onParticipantInfoPress={onOpenCallParticipantsInfo}
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
