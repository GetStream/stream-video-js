import React, {useEffect} from 'react';
import {useAppContext} from '../context/StreamChatContext';
import {useHeaderHeight} from '@react-navigation/elements';
import {
  Channel,
  MessageInput,
  MessageList,
  useAttachmentPickerContext,
  useOverlayContext,
} from 'stream-chat-react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList, StreamChatGenerics} from '../types';
import {Platform, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

type ChannelScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'ChannelScreen'
>;

export const ChannelScreen = (props: ChannelScreenProps) => {
  const {channel, setThread, thread} = useAppContext();
  const headerHeight = useHeaderHeight();
  const {setTopInset} = useAttachmentPickerContext();
  const {overlay} = useOverlayContext();
  const {navigation} = props;

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [navigation, overlay]);

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight, setTopInset]);

  if (channel === undefined) {
    return null;
  }

  return (
    <SafeAreaView>
      <Channel
        channel={channel}
        keyboardVerticalOffset={headerHeight}
        thread={thread}>
        <View style={styles.container}>
          <MessageList<StreamChatGenerics>
            onThreadSelect={threadMessage => {
              setThread(threadMessage);
              if (channel?.id) {
                navigation.navigate('ThreadScreen');
              }
            }}
          />
          <MessageInput />
        </View>
      </Channel>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
