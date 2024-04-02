import React, { useEffect, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from 'stream-chat-react-native';
import { AuthenticationProgress } from '../components/AuthenticatingProgress';
import { Channel as ChannelType } from 'stream-chat';
import { StreamChatGenerics } from '../../types';
import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { appTheme } from '../theme';

export type LivestreamChatProps = {
  callId: string;
  callType: string;
};

export const LivestreamChat = ({ callId, callType }: LivestreamChatProps) => {
  const [channel, setChannel] = useState<
    ChannelType<StreamChatGenerics> | undefined
  >(undefined);
  const { client } = useChatContext();
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

  // Done as per https://ui.gorhom.dev/components/bottom-sheet/keyboard-handling/ to solve the issue around keyboard hiding the text input in the chat inside bottom sheet.
  useEffect(() => {
    return () => {
      // Reset the flag on unmount
      shouldHandleKeyboardEvents.value = false;
    };
  }, [shouldHandleKeyboardEvents]);

  useEffect(() => {
    const createChannel = async () => {
      const newChannel = await client.channel(callType, callId);
      setChannel(newChannel);
    };
    createChannel();
  }, [client, callId, callType]);

  if (!channel) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: appTheme.colors.static_grey },
        ]}
      >
        <AuthenticationProgress />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Channel
        additionalTextInputProps={
          Platform.OS === 'ios'
            ? {
                // Done as per https://ui.gorhom.dev/components/bottom-sheet/keyboard-handling/ to solve keyboard hiding the text input in the chat inside bottom sheet.
                onBlur: () => {
                  shouldHandleKeyboardEvents.value = false;
                },
                onFocus: () => {
                  shouldHandleKeyboardEvents.value = true;
                },
              }
            : {}
        }
        channel={channel}
        onLongPressMessage={() => null}
      >
        <MessageList />
        <MessageInput InputButtons={undefined} />
      </Channel>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
});
