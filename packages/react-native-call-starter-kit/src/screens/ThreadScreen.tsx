import React, {useCallback, useEffect} from 'react';
import {NavigationStackParamsList, StreamChatGenerics} from '../types';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useHeaderHeight} from '@react-navigation/elements';
import {Channel, Thread, useOverlayContext} from 'stream-chat-react-native';
import {Platform, StyleSheet, View} from 'react-native';
import {useAppContext} from '../context/AppContext';

type ThreadScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'ThreadScreen'
>;

export function ThreadScreen({navigation}: ThreadScreenProps) {
  const {channel, setThread, thread} = useAppContext();
  const headerHeight = useHeaderHeight();
  const {overlay} = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay, navigation]);

  const onThreadDismountHandler = useCallback(() => {
    setThread(null);
  }, [setThread]);

  return (
    <Channel
      channel={channel!!}
      keyboardVerticalOffset={headerHeight}
      thread={thread}
      threadList>
      <View style={styles.container}>
        <Thread<StreamChatGenerics>
          onThreadDismount={onThreadDismountHandler}
        />
      </View>
    </Channel>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});
