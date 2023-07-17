import React, { useCallback } from 'react';
import {
  StreamVideoParticipant,
  useParticipants,
} from '@stream-io/video-react-native-sdk';
import { FlatList, FlatListProps, StyleSheet, Text, View } from 'react-native';
import { Avatar } from 'stream-chat-react-native';

type ParticipantFlatList = FlatListProps<StreamVideoParticipant>;

export function ParticipantsPanel() {
  const participants = useParticipants();
  const renderItem: NonNullable<ParticipantFlatList['renderItem']> =
    useCallback(({ item: participantItem }) => {
      const { isSpeaking } = participantItem;
      console.log({ isSpeaking });
      return (
        <View
          key={participantItem.sessionId}
          style={[styles.avatar, isSpeaking ? styles.speakingAvatar : null]}
        >
          <Avatar size={80} image={participantItem.image} />
          <Text>{participantItem.name}</Text>
        </View>
      );
    }, []);

  return (
    <FlatList
      bounces={false}
      style={styles.speakerListContainer}
      numColumns={3}
      data={participants}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  speakerListContainer: {
    flex: 1,
    padding: 4,
  },
  avatar: {
    flex: 1,
    alignItems: 'center',
  },
  speakingAvatar: {
    borderWidth: 1,
    borderColor: 'green',
  },
});
