import React, {useEffect} from 'react';
import {NavigationStackParamsList, StreamChatGenerics} from '../types';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useHeaderHeight} from '@react-navigation/elements';
import {Channel, Thread, useOverlayContext} from 'stream-chat-react-native';
import {Platform, StyleSheet, View} from 'react-native';
import {useStreamChatContext} from '../context/StreamChatContext';

type ThreadScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'ThreadScreen'
>;

export const ThreadScreen = (props: ThreadScreenProps) => {
  const {navigation} = props;
  const {channel, setThread, thread} = useStreamChatContext();
  const headerHeight = useHeaderHeight();
  const {overlay} = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay, navigation]);

  return (
    <Channel
      channel={channel!!}
      keyboardVerticalOffset={headerHeight}
      thread={thread}
      threadList>
      <View style={styles.container}>
        <Thread<StreamChatGenerics> onThreadDismount={() => setThread(null)} />
      </View>
    </Channel>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});
