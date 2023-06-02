import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { CallControlsButton } from './CallControlsButton';
import {
  useCall,
  useCallMembers,
  useConnectedUser,
} from '@stream-io/video-react-bindings';
import { UserInfoView } from './UserInfoView';
import { Phone, PhoneDown, Video, VideoSlash } from '../icons';
import { theme } from '../theme';
import { useMutingState } from '../hooks/useMutingState';
import { UserResponse } from '@stream-io/video-client';

export const IncomingCallView = () => {
  const { isVideoMuted, toggleVideoState } = useMutingState();
  const call = useCall();

  const answerCallHandler = async () => {
    try {
      await call?.join();
    } catch (error) {
      console.log('Error joining Call', error);
    }
  };

  const rejectCallHandler = async () => {
    try {
      await call?.leave({ reject: true });
    } catch (error) {
      console.log('Error leaving Call', error);
    }
  };

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
          onPress={toggleVideoState}
          color={
            !isVideoMuted ? theme.light.static_white : theme.light.overlay_dark
          }
          style={[styles.button, theme.button.lg]}
          svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
        >
          {isVideoMuted ? (
            <VideoSlash color={theme.light.static_white} />
          ) : (
            <Video color={theme.light.static_black} />
          )}
        </CallControlsButton>
        <CallControlsButton
          onPress={answerCallHandler}
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
  const includeSelf = false;

  // take the first N members to show their avatars
  const membersToShow: UserResponse[] = (members || [])
    .map(({ user }) => user)
    .filter((user) => user.id !== connectedUser?.id || includeSelf);

  if (members.length) {
    return (
      <ImageBackground
        blurRadius={10}
        source={{
          uri: membersToShow[0].image,
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
