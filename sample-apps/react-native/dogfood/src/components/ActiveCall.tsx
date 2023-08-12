import React, { useEffect, useRef, useState } from 'react';
import {
  CallingState,
  useCall,
  useIncallManager,
  theme,
  ReactionButton,
  ChatButton,
  ToggleVideoPublishingButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  HangUpCallButton,
  CallTopView,
  ChatButtonProps,
  useCallStateHooks,
  CallParticipantsSpotlight,
  CallParticipantsGrid,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { appTheme } from '../theme';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ParticipantsInfoList } from './ParticipantsInfoList';
import { Z_INDEX } from '../constants';

type ActiveCallProps = {
  chatButton?: ChatButtonProps;
  onHangupCallHandler?: () => void;
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
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  const callType = useCall()?.type;
  const activeCallRef = useRef(call);
  activeCallRef.current = call;
  const showSpotLightMode = callType !== 'audio_room' && hasScreenShare;

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
        {showSpotLightMode ? (
          <CallParticipantsSpotlight />
        ) : (
          <CallParticipantsGrid />
        )}
      </View>
      {/* Since we want the chat and the reaction button the entire call controls is customized */}
      <View
        style={[
          styles.callControlsWrapper,
          {
            paddingBottom: Math.max(bottom, appTheme.spacing.lg),
          },
        ]}
      >
        <ReactionButton />
        <ChatButton
          onPressHandler={chatButton?.onPressHandler}
          unreadBadgeCount={chatButton?.unreadBadgeCount}
        />
        <ToggleVideoPublishingButton />
        <ToggleAudioPublishingButton />
        <ToggleCameraFaceButton />
        <HangUpCallButton onPressHandler={onHangupCallHandler} />
      </View>
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
  icons: {
    position: 'absolute',
    right: theme.spacing.lg * 2,
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: appTheme.zIndex.IN_FRONT,
  },
  callControlsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.padding.md,
    zIndex: Z_INDEX.IN_FRONT,
    backgroundColor: appTheme.colors.static_grey,
  },
});
