import React, { useEffect, useRef, useState } from 'react';
import {
  CallControls,
  CallControlsType,
  CallingState,
  CallContent,
  useCall,
  useIncallManager,
  theme,
  CallTopView,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { appTheme } from '../theme';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ParticipantsInfoList } from './ParticipantsInfoList';

type ActiveCallProps = CallControlsType & {
  onBackPressed?: () => void;
};

export const ActiveCall = ({
  chatButton,
  hangUpCallButton,
  onBackPressed,
}: ActiveCallProps) => {
  const call = useCall();
  const activeCallRef = useRef(call);
  activeCallRef.current = call;
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);

  const onOpenCallParticipantsInfo = () => {
    setIsCallParticipantsVisible(true);
  };

  useEffect(() => {
    return () => {
      if (activeCallRef.current?.state.callingState !== CallingState.LEFT) {
        activeCallRef.current?.leave();
      }
    };
  }, []);

  /**
   * This hook is used to handle IncallManager specs of the application.
   */
  useIncallManager({ media: 'video', auto: true });

  const { bottom } = useSafeAreaInsets();

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <CallTopView
          onBackPressed={onBackPressed}
          onParticipantInfoPress={onOpenCallParticipantsInfo}
        />
        <CallContent />
      </View>
      <CallControls
        chatButton={chatButton}
        hangUpCallButton={hangUpCallButton}
        style={[
          styles.callControlsWrapper,
          { paddingBottom: Math.max(bottom, appTheme.spacing.lg) },
        ]}
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
    backgroundColor: appTheme.colors.static_grey,
  },
  icons: {
    position: 'absolute',
    right: theme.spacing.lg * 2,
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: appTheme.zIndex.IN_FRONT,
  },
  callControlsWrapper: {
    paddingTop: appTheme.spacing.lg,
    paddingHorizontal: appTheme.spacing.sm,
  },
});
