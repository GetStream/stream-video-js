import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from 'stream-chat-react-native';
import { AuthenticationProgress } from '../../components/AuthenticatingProgress';
import { Channel as ChannelType } from 'stream-chat';
import { MeetingStackParamList, StreamChatGenerics } from '../../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme, useI18n } from '@stream-io/video-react-native-sdk';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';

type ChatScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'ChatScreen'
>;

const ChannelHeader = () => {
  const chatLabelNoted = useAppGlobalStoreValue(
    (store) => store.chatLabelNoted,
  );
  const { t } = useI18n();
  const appStoreSetState = useAppGlobalStoreSetState();
  const [isNoted, setIsNoted] = useState<boolean>(!!chatLabelNoted);

  if (isNoted) {
    return null;
  }

  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>
        ℹ️{' '}
        {t(
          'Messages are currently visible to anyone with the link and valid session.',
        )}
      </Text>
      <Pressable
        style={styles.notedButton}
        onPress={() => {
          setIsNoted(true);
          appStoreSetState({ chatLabelNoted: true });
        }}
      >
        <Text style={styles.notedButtonText}>{t('Noted')}</Text>
      </Pressable>
    </View>
  );
};

export const ChatScreen = ({ route }: ChatScreenProps) => {
  const [channel, setChannel] = useState<
    ChannelType<StreamChatGenerics> | undefined
  >(undefined);
  const { client } = useChatContext();
  const {
    params: { callId },
  } = route;
  const CHANNEL_TYPE = 'videocall';

  useEffect(() => {
    const createChannel = async () => {
      const newChannel = await client.channel(CHANNEL_TYPE, callId);
      setChannel(newChannel);
    };
    createChannel();
  }, [client, callId]);

  if (!channel) {
    return <AuthenticationProgress />;
  }

  return (
    <SafeAreaView>
      <Channel channel={channel}>
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </Channel>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 10,
    flexDirection: 'row',
    backgroundColor: theme.dark.static_black,
  },
  headerText: { flex: 1, color: theme.dark.static_white },
  notedButton: {
    backgroundColor: theme.light.primary,
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  notedButtonText: {
    color: theme.dark.static_white,
    fontWeight: '500',
  },
});
