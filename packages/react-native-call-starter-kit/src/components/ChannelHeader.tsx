import React, {useCallback} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Call} from '../icons/Call';
import {useAppContext} from '../context/AppContext';
import {Back} from '../icons/Back';
import {NativeStackHeaderProps} from '@react-navigation/native-stack';
import {useCall} from '@stream-io/video-react-native-sdk';
import {useChatContext} from 'stream-chat-react-native';

type ChannelHeaderProps = NativeStackHeaderProps;

export const ChannelHeader = (props: ChannelHeaderProps) => {
  const {navigation} = props;
  const {channel} = useAppContext();
  const {client} = useChatContext();
  const call = useCall();
  const members = Object.keys(channel?.state?.members || {}).filter(
    member => member !== client.user?.id,
  );

  const joinCallHandler = useCallback(async () => {
    if (!call) {
      return;
    }

    try {
      await call.getOrCreate({
        ring: true,
        data: {
          members: members.map(ringingUserId => {
            return {
              user_id: ringingUserId,
            };
          }),
        },
      });
    } catch (error) {
      console.log('Failed to createCall', call.id, 'default', error);
    }
  }, [call, members]);

  const goBackHandler = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.header}>
      <Pressable onPress={goBackHandler} style={styles.icon}>
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
