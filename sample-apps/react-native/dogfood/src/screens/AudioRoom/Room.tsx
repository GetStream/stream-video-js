import React, { useCallback } from 'react';
import {
  StreamVideoParticipant,
  useCall,
  useIncallManager,
  useParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { FlatList, FlatListProps, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DescriptionPanel } from '../../components/AudioRoom/DescriptionPanel';
import { ControlsPanel } from '../../components/AudioRoom/ControlsPanel';
import { SpeakingPermissionsRequestButtonsList } from '../../components/AudioRoom/SpeakerPermissionsRequestList';
import { Avatar } from 'stream-chat-react-native';

type ParticipantFlatList = FlatListProps<StreamVideoParticipant>;

export default function Room() {
  const client = useStreamVideoClient();
  const call = useCall();

  useIncallManager({ media: 'audio', auto: true });
  const participants = useParticipants();

  const renderItem: NonNullable<ParticipantFlatList['renderItem']> =
    useCallback(({ item: participantItem }) => {
      const { isSpeaking } = participantItem;
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

  if (!client || !call) {
    return null;
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <DescriptionPanel />
      <FlatList
        bounces={false}
        style={styles.speakerListContainer}
        numColumns={3}
        data={participants}
        renderItem={renderItem}
      />
      <ControlsPanel />
      <SpeakingPermissionsRequestButtonsList />
    </SafeAreaView>
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
