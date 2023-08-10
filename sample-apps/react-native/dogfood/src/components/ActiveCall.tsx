import React, { useEffect, useRef, useState } from 'react';
import {
  CallContentProps,
  CallControlsType,
  CallingState,
  ParticipantsInfoBadge,
  CallContent,
  useCall,
  useIncallManager,
  theme,
  ReactionButton,
  ChatButton,
  ToggleVideoPublishingButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  HangUpCallButton,
  ChatButtonProps,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { appTheme } from '../theme';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ActiveCallNotification } from './ActiveCallNotification';
import { ParticipantsLayoutSwitchButton } from './ParticipantsLayoutButton';
import { Z_INDEX } from '@stream-io/video-react-native-sdk/src/constants';

type ActiveCallProps = CallControlsType & {
  chatButton?: ChatButtonProps;
  onHangupCallHandler?: () => void;
};

type Layout = CallContentProps['mode'];

export const ActiveCall = ({
  chatButton,
  onHangupCallHandler,
}: ActiveCallProps) => {
  const call = useCall();
  const activeCallRef = useRef(call);
  activeCallRef.current = call;
  const [selectedLayout, setSelectedLayout] = useState<Layout>('grid');

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

  const { bottom, top } = useSafeAreaInsets();

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ActiveCallNotification />
      <View style={[styles.icons, { top }]}>
        <ParticipantsLayoutSwitchButton
          selectedLayout={selectedLayout}
          setSelectedLayout={setSelectedLayout}
        />
        <ParticipantsInfoBadge />
      </View>
      <CallContent mode={selectedLayout} />
      {/* Since we want the chat and the reaction button the entire call controls is customized */}
      <View
        style={[
          styles.callControlsWrapper,
          { paddingBottom: Math.max(bottom, appTheme.spacing.lg) },
        ]}
      >
        <ReactionButton />
        <ChatButton
          onPressHandler={chatButton?.onPressHandler}
          unreadBadgeCountIndicator={chatButton?.unreadBadgeCountIndicator}
        />
        <ToggleVideoPublishingButton />
        <ToggleAudioPublishingButton />
        <ToggleCameraFaceButton />
        <HangUpCallButton onPressHandler={onHangupCallHandler} />
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.padding.sm,
    zIndex: Z_INDEX.IN_FRONT,
  },
});
