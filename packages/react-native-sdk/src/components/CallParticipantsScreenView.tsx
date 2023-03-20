import { SfuModels } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { FlatList, StyleSheet, View } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { theme } from '../theme';

const PARTICIPANT_VIEW_CONTAINER_SIZE = {
  width: 150,
  height: 150,
};

export const CallParticipantsScreenView = () => {
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  return (
    <View style={{ flex: 1, padding: theme.padding.md }}>
      {firstScreenSharingParticipant && (
        <View style={styles.screenShareContainer}>
          <ParticipantView
            participant={firstScreenSharingParticipant}
            containerStyle={{ flex: 1 }}
            kind="screen"
          />
        </View>
      )}

      <FlatList
        showsHorizontalScrollIndicator={false}
        horizontal
        data={allParticipants}
        style={styles.participantVideoContainer}
        renderItem={({ item: participant, index }) => {
          const isLast = index === allParticipants.length - 1;
          return (
            <ParticipantView
              key={`${participant.userId}/${participant.sessionId}`}
              participant={participant}
              kind="video"
              containerStyle={[
                styles.participantViewContainer,
                isLast && { marginRight: 0 },
              ]}
            />
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenShareContainer: {
    flex: 3,
  },
  participantVideoContainer: {
    flex: 1,
    paddingTop: theme.padding.lg,
  },
  participantViewContainer: {
    ...PARTICIPANT_VIEW_CONTAINER_SIZE,
    marginRight: theme.margin.sm,
    borderRadius: theme.rounded.sm,
    overflow: 'hidden',
  },
});
