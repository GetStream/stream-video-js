import {ParticipantView} from '@stream-io/video-react-native-sdk';
import {useSortedParticipants} from './useSortedParticipants';
import {FlatList, StyleSheet, View} from 'react-native';
import {StreamVideoParticipant} from '@stream-io/video-client';
import {hasScreenShare} from './utils';
import React from 'react';
import {useConnectedUser} from '@stream-io/video-react-bindings';

export default () => {
  const [participantInSpotlight, ...otherParticipants] =
    useSortedParticipants();
  const connectedUser = useConnectedUser();

  const renderItem = ({item: participant}: {item: StreamVideoParticipant}) => {
    return (
      <ParticipantView
        participant={participant}
        containerStyle={[styles.baseParticipant, styles.participant]}
        disableAudio={participant.userId === connectedUser?.id}
        kind="video"
      />
    );
  };

  return (
    <View style={styles.container}>
      {participantInSpotlight && (
        <ParticipantView
          participant={participantInSpotlight}
          containerStyle={[styles.baseParticipant, styles.spotlightParticipant]}
          kind={hasScreenShare(participantInSpotlight) ? 'screen' : 'video'}
          disableAudio={participantInSpotlight.userId === connectedUser?.id}
        />
      )}
      <View style={styles.participantVideoContainer}>
        <FlatList<StreamVideoParticipant>
          data={otherParticipants}
          keyExtractor={item => item.sessionId}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  participantVideoContainer: {
    paddingVertical: 16,
  },
  baseParticipant: {
    marginHorizontal: 8,
    overflow: 'hidden',
    borderRadius: 10,
  },
  spotlightParticipant: {
    flex: 1,
  },
  participant: {
    width: 150,
    height: 150,
  },
});
