import { SfuModels } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.participantVideoContainer}
      >
        {allParticipants.map((participant) => (
          <ParticipantView
            key={`${participant.userId}/${participant.sessionId}`}
            participant={participant}
            kind="video"
            containerStyle={styles.participantVideoBox}
            videoRendererStyle={{ borderRadius: 8 }}
          />
        ))}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  screenShareContainer: {
    flex: 3,
  },
  participantVideoContainer: {
    flex: 1,
    backgroundColor: 'pink',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 24,
    bottom: 24,
  },
  participantVideoBox: {
    width: 150,
    height: 150,
    marginRight: 8,
  },
});
