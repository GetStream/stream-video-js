import { SfuModels } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { View, Text, StyleSheet } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { theme } from '../theme';

export const CallParticipantsScreenView = () => {
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  // TODO: temporaily showing only 2 participants, in future we show all using flatlist
  const firstTwoParticipants = allParticipants.slice(0, 2);

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

      <View style={styles.participantVideoContainer}>
        {firstTwoParticipants.map((participant) => (
          <ParticipantView
            key={`${participant.userId}/${participant.sessionId}`}
            participant={participant}
            size={'small'}
            kind="video"
            style={styles.participantVideoBox}
          />
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  screenShareContainer: {
    flex: 3,
  },
  participantVideoContainer: {
    marginTop: theme.margin.sm,
    flex: 1,
    flexDirection: 'row',
  },
  participantVideoBox: {
    borderRadius: 16,
    marginLeft: theme.margin.sm,
  },
});
