import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from 'stream-chat-react-native';
import { AuthenticationProgress } from '../../components/AuthenticatingProgress';
import { Channel as ChannelType } from 'stream-chat';
import { MeetingStackParamList } from '../../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@stream-io/video-react-native-sdk';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';

type ChatScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'ChatScreen'
>;

const ChannelHeader = () => {
  const styles = useStyles();
  const chatLabelNoted = useAppGlobalStoreValue(
    (store) => store.chatLabelNoted,
  );
  const appStoreSetState = useAppGlobalStoreSetState();
  const [isNoted, setIsNoted] = useState<boolean>(!!chatLabelNoted);

  if (isNoted) {
    return null;
  }

  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>
        ℹ️ Messages are currently visible to anyone with the link and valid
        session.
      </Text>
      <Pressable
        style={styles.notedButton}
        onPress={() => {
          setIsNoted(true);
          appStoreSetState({ chatLabelNoted: true });
        }}
      >
        <Text style={styles.notedButtonText}>Noted</Text>
      </Pressable>
    </View>
  );
};

export const ChatScreen = ({ route }: ChatScreenProps) => {
  const [channel, setChannel] = useState<ChannelType>();
  const { client } = useChatContext();
  const {
    params: { callId },
  } = route;
  const CHANNEL_TYPE = 'videocall';

  useEffect(() => {
    const newChannel = client.channel(CHANNEL_TYPE, callId);
    setChannel(newChannel);
  }, [client, callId]);

  if (!channel) {
    return <AuthenticationProgress />;
  }

  return (
    <SafeAreaView>
      <StatusBar barStyle="default" />
      <Channel channel={channel} keyboardVerticalOffset={120}>
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </Channel>
    </SafeAreaView>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        header: {
          padding: 10,
          flexDirection: 'row',
          backgroundColor: 'black',
        },
        headerText: { flex: 1, color: 'white' },
        notedButton: {
          backgroundColor: theme.colors.buttonPrimary,
          justifyContent: 'center',
          padding: 10,
          borderRadius: 10,
          marginLeft: 10,
        },
        notedButtonText: {
          color: 'white',
          fontWeight: '500',
        },
      }),
    [theme],
  );
};
