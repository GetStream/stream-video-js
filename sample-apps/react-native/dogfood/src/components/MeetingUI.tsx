import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActiveCall, useCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../types';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LobbyViewComponent } from './LobbyViewComponent';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useChannelWatch } from '../hooks/useChannelWatch';
import { appTheme } from '../theme';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  show: ScreenTypes;
  setShow: React.Dispatch<React.SetStateAction<ScreenTypes>>;
};

export const MeetingUI = ({
  callId,
  navigation,
  route,
  show,
  setShow,
}: Props) => {
  const call = useCall();
  const channelWatched = useChannelWatch();
  const unreadBadgeCountIndicator = useUnreadCount({ channelWatched });

  const returnToHomeHandler = () => {
    navigation.navigate('JoinMeetingScreen');
  };

  const backToLobbyHandler = () => {
    setShow('lobby');
  };

  if (show === 'error-join' || show === 'error-leave') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error Joining Call</Text>
        <Button title="Return to Home" onPress={returnToHomeHandler} />
        <Button title="Back to Lobby" onPress={backToLobbyHandler} />
      </View>
    );
  } else if (show === 'lobby') {
    return <LobbyViewComponent callId={callId} {...{ navigation, route }} />;
  } else if (!call) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Lost Active Call Connection</Text>
        <Button title="Return to Home" onPress={returnToHomeHandler} />
        <Button title="Back to Lobby" onPress={backToLobbyHandler} />
      </View>
    );
  } else {
    return (
      <SafeAreaView style={styles.wrapper}>
        <ActiveCall
          chatButton={{
            onPressHandler: () => {
              navigation.navigate('ChatScreen', { callId: callId });
            },
            unreadBadgeCountIndicator,
          }}
        />
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: appTheme.colors.static_grey,
  },
  wrapper: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: appTheme.spacing.xs,
    paddingHorizontal: appTheme.spacing.lg,
  },
  errorText: {
    fontSize: 30,
    color: appTheme.colors.error,
    textAlign: 'center',
  },
});
