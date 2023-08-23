import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { UserInfo } from './UserInfo';
import {
  CallTopView as DefaultCallTopView,
  CallTopViewProps,
} from '../CallTopView';
import {
  IncomingCallControls as DefaultIncomingCallControls,
  IncomingCallControlsProps,
} from '../CallControls';
import { useTheme } from '../../../contexts';

/**
 * Props for the IncomingCall Component.
 */
export type IncomingCallProps = IncomingCallControlsProps & {
  /**
   * Prop to customize the CallTopView component in the IncomingCall component.
   */
  CallTopView?: React.ComponentType<CallTopViewProps> | null;
  /**
   * Prop to customize the IncomingCall controls.
   */
  IncomingCallControls?: React.ComponentType<IncomingCallControlsProps> | null;
};

/**
 * An incoming call with the caller's avatar, name and accept/reject buttons.
 * Used when the user is receiving a call.
 */
export const IncomingCall = ({
  onAcceptCallHandler,
  onRejectCallHandler,
  CallTopView = DefaultCallTopView,
  IncomingCallControls = DefaultIncomingCallControls,
}: IncomingCallProps) => {
  const { t } = useI18n();
  const {
    theme: { colors, incomingCall, typefaces },
  } = useTheme();

  return (
    <Background>
      {CallTopView && <CallTopView />}
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

      {IncomingCallControls && (
        <IncomingCallControls
          onAcceptCallHandler={onAcceptCallHandler}
          onRejectCallHandler={onRejectCallHandler}
        />
      )}
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
});
