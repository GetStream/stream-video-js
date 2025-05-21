import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { UserInfo } from './UserInfo';
import {
  IncomingCallControls as DefaultIncomingCallControls,
  type IncomingCallControlsProps,
} from '../CallControls';
import { useTheme } from '../../../contexts';

/**
 * Props for the IncomingCall Component.
 */
export type IncomingCallProps = IncomingCallControlsProps & {
  /**
   * Prop to customize the IncomingCall controls.
   */
  IncomingCallControls?: React.ComponentType<IncomingCallControlsProps> | null;
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
};

/**
 * An incoming call with the caller's avatar, name and accept/reject buttons.
 * Used when the user is receiving a call.
 */
export const IncomingCall = ({
  onAcceptCallHandler,
  onRejectCallHandler,
  IncomingCallControls = DefaultIncomingCallControls,
  landscape,
}: IncomingCallProps) => {
  const { t } = useI18n();
  const {
    theme: { colors, incomingCall, typefaces },
  } = useTheme();

  const landscapeContentStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <Background>
      <View
        style={[styles.content, landscapeContentStyles, incomingCall.content]}
      >
        <View style={[styles.topContainer, incomingCall.topContainer]}>
          <UserInfo />
          <Text
            style={[
              styles.incomingCallText,
              { color: colors.textPrimary },
              typefaces.heading6,
              incomingCall.incomingCallText,
            ]}
          >
            {t('Incoming Call...')}
          </Text>
        </View>
        <View style={[styles.bottomContainer, incomingCall.bottomContainer]}>
          <View
            style={[
              styles.incomingCallControls,
              incomingCall.incomingCallControls,
            ]}
          >
            {IncomingCallControls && (
              <IncomingCallControls
                onAcceptCallHandler={onAcceptCallHandler}
                onRejectCallHandler={onRejectCallHandler}
              />
            )}
          </View>
        </View>
      </View>
    </Background>
  );
};

const Background: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => {
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
        source={{
          uri: avatarsToShow[0],
        }}
        style={[
          styles.background,
          { backgroundColor: colors.sheetTertiary },
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
        styles.background,
        { backgroundColor: colors.sheetTertiary },
        incomingCall.background,
      ]}
    >
      {children}
    </View>
  );
};

export const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  topContainer: { flex: 1, justifyContent: 'center' },
  incomingCallText: {
    marginTop: 8,
    textAlign: 'center',
  },
  bottomContainer: { flex: 1, justifyContent: 'center' },
  incomingCallControls: {
    justifyContent: 'center',
  },
});
