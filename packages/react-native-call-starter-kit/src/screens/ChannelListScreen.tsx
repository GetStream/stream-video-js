import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {ChannelList} from 'stream-chat-react-native';
import type {ChannelSort} from 'stream-chat';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {NavigationStackParamsList, StreamChatGenerics} from '../types';
import {useAppContext} from '../context/AppContext';

const sort: ChannelSort<StreamChatGenerics> = {last_message_at: -1};
const options = {
  presence: true,
  state: true,
  watch: true,
  limit: 30,
};

type ChannelListScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'ChannelListScreen'
>;

export function ChannelListScreen({navigation}: ChannelListScreenProps) {
  const {setChannel, userId} = useAppContext();

  const filters = {
    type: 'messaging',
    members: {$in: [userId!!]},
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChannelList<StreamChatGenerics>
        filters={filters}
        onSelect={channel => {
          setChannel(channel);
          navigation.navigate('ChannelScreen');
        }}
        options={options}
        sort={sort}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
});
