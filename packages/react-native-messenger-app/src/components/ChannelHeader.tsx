import React, {useCallback} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Call} from '../icons/Call';
import {useStreamChatContext} from '../context/StreamChatContext';
import {Back} from '../icons/Back';
import {NativeStackHeaderProps} from '@react-navigation/native-stack';
import {useStreamVideoClient} from '@stream-io/video-react-native-sdk';
import {v4 as uuidv4} from 'uuid';
import {useChatContext} from 'stream-chat-react-native';

type ChannelHeaderProps = NativeStackHeaderProps;

export const ChannelHeader = (props: ChannelHeaderProps) => {
  const {navigation} = props;
  const {channel} = useStreamChatContext();
  const {client} = useChatContext();
  const videoClient = useStreamVideoClient();
  const members = Object.keys(channel?.state?.members || {}).filter(
    member => member !== client.user?.id,
  );

  const joinCallHandler = useCallback(() => {
    const callID = uuidv4().toLowerCase();

    if (videoClient) {
      try {
        videoClient
          ?.createCall({
            id: callID,
            type: 'default',
            input: {
              ring: true,
              members: members.map(ringingUserId => {
                return {
                  userId: ringingUserId,
                  role: 'member',
                  customJson: new Uint8Array(),
                };
              }),
            },
          })
          .then(response => {
            console.log(response);
          });
      } catch (error) {
        console.log('Failed to createCall', callID, 'default', error);
      }
    }
  }, [videoClient, members]);

  return (
    <View style={styles.header}>
      <Pressable onPress={() => navigation.goBack()} style={styles.icon}>
        <Back color="#52be80" />
      </Pressable>
      <Text style={styles.name}>
        {channel?.data?.name || channel?.state.members[members[0]].user?.name}
      </Text>
      <Pressable onPress={joinCallHandler} style={styles.icon}>
        <Call color="#000" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 50,
    paddingBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  icon: {
    height: 18,
    width: 18,
  },
});
