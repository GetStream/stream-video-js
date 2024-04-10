import React, { useEffect, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from 'stream-chat-react-native';
import { AuthenticationProgress } from '../AuthenticatingProgress';
import { Channel as ChannelType } from 'stream-chat';
import { StreamChatGenerics } from '../../../types';
import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { appTheme } from '../../theme';

export type LivestreamChatProps = {
  callId: string;
};

export const LivestreamChat = ({ callId }: LivestreamChatProps) => {
  const [channel, setChannel] = useState<
    ChannelType<StreamChatGenerics> | undefined
  >(undefined);
  const { client } = useChatContext();
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

  /**
   * Done as per the text input behaviour from BottomSheetTextInput(https://github.com/gorhom/react-native-bottom-sheet/blob/master/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx)
   * to solve the issue around keyboard hiding the text input in the chat inside bottom sheet.
   * The tip in https://ui.gorhom.dev/components/bottom-sheet/keyboard-handling/ is followed.
   */
  useEffect(() => {
    return () => {
      // Reset the flag on unmount
      shouldHandleKeyboardEvents.value = false;
    };
  }, [shouldHandleKeyboardEvents]);

  useEffect(() => {
    const watchChatChannel = async () => {
      const newChannel = client.channel('livestream', callId);
      await newChannel.watch();
      setChannel(newChannel);
    };
    watchChatChannel();
  }, [client, callId]);

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
        // On Android, the default behaviour is as expected so we do not need to apply the fix to the text input to work with keyboard.
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
