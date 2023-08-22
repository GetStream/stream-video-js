import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { UserInfo } from './UserInfo';
import { RejectCallButton } from './CallControls/RejectCallButton';
import { AcceptCallButton } from './CallControls/AcceptCallButton';
import { ToggleVideoPreviewButton } from './CallControls/ToggleVideoPreviewButton';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * The props for the Accept Call button in the IncomingCall component.
 */
type AcceptCallButtonProps = {
  /**
   * Handler to be called when the accept call button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * The props for the Reject Call button in the IncomingCall component.
 */
type RejectCallButtonProps = {
  /**
   * Handler to be called when the reject call button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Props for the IncomingCall Component.
 */
export type IncomingCallType = {
  /**
   * Accept Call Button Props to be passed as an object
   */
  acceptCallButton?: AcceptCallButtonProps;
  /**
   * Reject Call Button Props to be passed as an object
   */
  rejectCallButton?: RejectCallButtonProps;
};

/**
 * An incoming call with the caller's avatar, name and accept/reject buttons.
 * Used when the user is receiving a call.
 */
export const IncomingCall = ({
  acceptCallButton,
  rejectCallButton,
}: IncomingCallType) => {
  const { t } = useI18n();
  const {
    theme: { colors, incomingCall, typefaces },
  } = useTheme();

  return (
    <Background>
      <View style={[styles.content, incomingCall.content]}>
        <UserInfo />
        <Text
          style={[
            styles.incomingCallText,
            { color: colors.static_white },
            typefaces.heading6,
            incomingCall.incomingCallText,
          ]}
        >
          {t('Incoming Call...')}
        </Text>
      </View>

      <View style={[styles.buttonGroup, incomingCall.buttonGroup]}>
        <RejectCallButton onPressHandler={rejectCallButton?.onPressHandler} />
        <ToggleVideoPreviewButton />
        <AcceptCallButton onPressHandler={acceptCallButton?.onPressHandler} />
      </View>
    </Background>
  );
};

const Background: React.FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    theme: { colors, incomingCall },
  } = useTheme();
  const connectedUser = useConnectedUser();
  const { useCallMembers } = useCallStateHooks();
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
        style={[
          StyleSheet.absoluteFill,
          styles.background,
          { backgroundColor: colors.static_grey },
          incomingCall.background,
        ]}
      >
        {children}
      </ImageBackground>
    );
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.background,
        { backgroundColor: colors.static_grey },
        incomingCall.background,
      ]}
    >
      {children}
    </View>
  );
};

export const styles = StyleSheet.create({
  background: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 64,
  },
  content: {},
  incomingCallText: {
    marginTop: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
