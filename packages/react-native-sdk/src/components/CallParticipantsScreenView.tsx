import { SfuModels } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ParticipantView } from './ParticipantView';

export const CallParticipantsScreenView = () => {
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  return (
    <>
      {firstScreenSharingParticipant && (
        <View style={styles.screenShareContainer}>
          <Text>
            {firstScreenSharingParticipant.userId} is presenting their screen.
          </Text>
          <ParticipantView
            participant={firstScreenSharingParticipant}
            size={'large'}
            kind="screen"
          />
        </View>
      )}

      <FlatList
        horizontal
        data={allParticipants}
        style={styles.participantVideoContainer}
        renderItem={({ item: participant }) => (
          <ParticipantView
            key={`${participant.userId}/${participant.sessionId}`}
            participant={participant}
            kind="video"
            containerStyle={styles.participantViewContainer}
          />
        )}
      />
    </>
  );
};

const styles = StyleSheet.create({
  screenShareContainer: {
    flex: 3,
  },
  participantVideoContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 24,
    bottom: 24,
  },
  participantViewContainer: {
    width: 150,
    height: 150,
    marginRight: 8,
    overflow: 'hidden',
    borderRadius: 8,
  },
});
