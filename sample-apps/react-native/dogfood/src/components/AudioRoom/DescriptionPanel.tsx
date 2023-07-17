import {
  useCallMetadata,
  useParticipants,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const DescriptionPanel = () => {
  const participants = useParticipants();
  const metadata = useCallMetadata();
  const custom = metadata?.custom;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{custom?.title ?? '<Title>'}</Text>
      <Text style={styles.subtitle}>
        {custom?.description ?? '<Description>'}
      </Text>
      <Text style={styles.participantsCount}>
        {participants.length} participants
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'black',
    paddingVertical: 4,
    fontSize: 14,
  },
  participantsCount: {
    color: 'black',
    fontSize: 12,
  },
});
