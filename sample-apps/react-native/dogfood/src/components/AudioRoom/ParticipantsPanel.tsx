import React, { useCallback } from 'react';
import {
  Avatar,
  StreamVideoParticipant,
  useParticipants,
} from '@stream-io/video-react-native-sdk';
import { FlatList, FlatListProps, StyleSheet, Text, View } from 'react-native';

type ParticipantFlatList = FlatListProps<StreamVideoParticipant>;

export function ParticipantsPanel() {
  const participants = useParticipants();
  const renderItem: NonNullable<ParticipantFlatList['renderItem']> =
    useCallback(({ item: participantItem }) => {
      const { isSpeaking } = participantItem;
      return (
        <View
          key={participantItem.sessionId}
          style={[styles.avatar, isSpeaking ? styles.speakingAvatar : null]}
        >
          <Avatar radius={80} participant={participantItem} />
          <Text style={styles.text}>{participantItem.name}</Text>
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
  text: {
    color: 'black',
  },
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
