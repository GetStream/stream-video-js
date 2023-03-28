import {
  CallControlsView,
  ParticipantView,
} from '@stream-io/video-react-native-sdk';
import {useSortedParticipants} from './useSortedParticipants';
import {FlatList, StyleSheet, View} from 'react-native';
import {theme} from '@stream-io/video-react-native-sdk/dist/src/theme';
import {StreamVideoParticipant} from '@stream-io/video-client';
import {hasScreenShare} from './utils';
import React from 'react';
export default () => {
  const [participantInSpotlight, ...otherParticipants] =
    useSortedParticipants();

  const renderItem = ({item: participant}: {item: StreamVideoParticipant}) => {
    return (
      <ParticipantView
        participant={participant}
        containerStyle={[styles.baseParticipant, styles.participant]}
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
      <CallControlsView onHangupCall={() => null} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  participantVideoContainer: {
    paddingVertical: theme.padding.md,
  },
  baseParticipant: {
    marginHorizontal: theme.margin.sm,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
  },
  spotlightParticipant: {
    flex: 1,
  },
  participant: {
    width: 150,
    height: 150,
  },
});
