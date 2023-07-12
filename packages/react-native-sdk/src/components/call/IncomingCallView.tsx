import React, { useCallback } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { CallControlsButton } from '../utility/internal/CallControlsButton';
import {
  useCall,
  useCallCallingState,
  useCallMembers,
  useConnectedUser,
} from '@stream-io/video-react-bindings';
import { UserInfoView } from './internal/UserInfoView';
import { Phone, PhoneDown, Video, VideoSlash } from '../../icons';
import { theme } from '../../theme';
import { useMediaStreamManagement } from '../../providers/MediaStreamManagement';
import { CallingState } from '@stream-io/video-client';

/**
 * The props for the Accept Call button in the IncomingCallView component.
 */
type AcceptCallButton = {
  /**
   * Handler to be called when the accept call button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * The props for the Reject Call button in the IncomingCallView component.
 */
type RejectCallButton = {
  /**
   * Handler to be called when the reject call button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Props for the IncomingCallView Component.
 */
export type IncomingCallViewType = {
  /**
   * Accept Call Button Props to be passed as an object
   */
  acceptCallButton?: AcceptCallButton;
  /**
   * Reject Call Button Props to be passed as an object
   */
  rejectCallButton?: RejectCallButton;
};

/**
 * An incoming call view with the caller's avatar, name and accept/reject buttons.
 * Used when the user is receiving a call.
 */
export const IncomingCallView = ({
  acceptCallButton,
  rejectCallButton,
}: IncomingCallViewType) => {
  const { toggleInitialVideoMuteState, initialVideoEnabled } =
    useMediaStreamManagement();
  const call = useCall();
  const callingState = useCallCallingState();

  const acceptCallHandler = useCallback(async () => {
    try {
      await call?.join();
      if (acceptCallButton?.onPressHandler) {
        acceptCallButton.onPressHandler();
      }
    } catch (error) {
      console.log('Error joining Call', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  const rejectCallHandler = useCallback(async () => {
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave({ reject: true });
      if (rejectCallButton?.onPressHandler) {
        rejectCallButton.onPressHandler();
      }
    } catch (error) {
      console.log('Error rejecting Call', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  return (
    <Background>
      <View style={styles.content}>
        <UserInfoView />
        <Text style={styles.incomingCallText}>Incoming Call...</Text>
      </View>

      <View style={styles.buttonGroup}>
        <CallControlsButton
          onPress={rejectCallHandler}
          color={theme.light.error}
          style={[styles.button, theme.button.lg]}
          svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
        >
          <PhoneDown color={theme.light.static_white} />
        </CallControlsButton>
        <CallControlsButton
          onPress={toggleInitialVideoMuteState}
          color={
            initialVideoEnabled
              ? theme.light.static_white
              : theme.light.overlay_dark
          }
          style={[styles.button, theme.button.lg]}
          svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
        >
          {!initialVideoEnabled ? (
            <VideoSlash color={theme.light.static_white} />
          ) : (
            <Video color={theme.light.static_black} />
          )}
        </CallControlsButton>
        <CallControlsButton
          onPress={acceptCallHandler}
          color={theme.light.info}
          style={[styles.button, theme.button.lg]}
          svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
        >
          <Phone color={theme.light.static_white} />
        </CallControlsButton>
      </View>
    </Background>
  );
};

const Background: React.FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => {
  const connectedUser = useConnectedUser();
  const members = useCallMembers();

  // take the first N members to show their avatars
  const avatarsToShow = (members || [])
    .filter(({ user }) => user.id !== connectedUser?.id)
    .map(({ user }) => user.image)
    .filter((image): image is string => !!image);

  if (avatarsToShow.length) {
    return (
      <ImageBackground
        blurRadius={10}
        source={{
          uri: avatarsToShow[0],
        }}
        style={[StyleSheet.absoluteFill, styles.background]}
      >
        {children}
      </ImageBackground>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, styles.background]}>{children}</View>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: theme.light.static_grey,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 2 * theme.margin.xl,
  },
  content: {},
  incomingCallText: {
    marginTop: theme.margin.md,
    textAlign: 'center',
    color: theme.light.static_white,
    ...theme.fonts.heading6,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.padding.xl,
  },
  button: {},
  svgContainerStyle: {},
});
