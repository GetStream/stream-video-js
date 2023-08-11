import React, { useCallback } from 'react';
import {
  StreamVideoParticipant,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import {
  FlatList,
  FlatListProps,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ParticipantFlatList = FlatListProps<StreamVideoParticipant>;

export function ParticipantsPanel() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const renderItem: NonNullable<ParticipantFlatList['renderItem']> =
    useCallback(({ item: participantItem }) => {
      const { isSpeaking } = participantItem;
      return (
        <View
          key={participantItem.sessionId}
          style={[styles.avatar, isSpeaking ? styles.speakingAvatar : null]}
        >
          <Image style={styles.image} source={{ uri: participantItem.image }} />
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
    borderWidth: 4,
    borderColor: 'transparent',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  speakingAvatar: {
    borderColor: 'green',
  },
});
