import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActiveCall,
  ActiveCallProps,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../types';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';
import { ParticipantListButtons } from '../components/ParticipantListButtons';
import { LobbyViewComponent } from './LobbyViewComponent';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useChannelWatch } from '../hooks/useChannelWatch';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  show: ScreenTypes;
  setShow: React.Dispatch<React.SetStateAction<ScreenTypes>>;
};
type Mode = NonNullable<ActiveCallProps['mode']>;

export const MeetingUI = ({
  callId,
  navigation,
  route,
  show,
  setShow,
}: Props) => {
  const [selectedMode, setSelectedMode] = React.useState<Mode>('grid');
  const call = useCall();
  const channelWatched = useChannelWatch();
  const unreadCount = useUnreadCount({ channelWatched });

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
        <ParticipantListButtons
          selectedMode={selectedMode}
          setMode={setSelectedMode}
        />
        <ActiveCall
          mode={selectedMode}
          chatButton={{
            onPressHandler: () => {
              navigation.navigate('ChatScreen', { callId: callId });
            },
            unreadBadgeCountIndicator: unreadCount,
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
    backgroundColor: theme.light.static_grey,
  },
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 30,
    color: 'red',
    textAlign: 'center',
  },
});
