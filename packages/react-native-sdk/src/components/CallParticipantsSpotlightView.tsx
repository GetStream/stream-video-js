import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { theme } from '../theme';
import { useDebouncedValue } from '../utils/hooks';
import { CallParticipantsList } from './CallParticipantsList';
import { speakerLayoutSortPreset } from '@stream-io/video-client';

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

export const CallParticipantsSpotlightView = () => {
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const [participantInSpotlight, ...otherParticipants] = allParticipants;
  const isScreenShareOnSpotlight = hasScreenShare(participantInSpotlight);

  return (
    <View style={styles.container}>
      {participantInSpotlight && (
        <View style={styles.screenShareContainer}>
          <ParticipantView
            participant={participantInSpotlight}
            containerStyle={{ flex: 1 }}
            kind={isScreenShareOnSpotlight ? 'screen' : 'video'}
          />
        </View>
      )}
      <View style={styles.participantVideoContainer}>
        <CallParticipantsList
          participants={
            isScreenShareOnSpotlight ? allParticipants : otherParticipants
          }
          horizontal
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenShareContainer: {
    flex: 1,
    paddingTop: theme.padding.md,
    paddingHorizontal: theme.padding.md,
  },
  participantVideoContainer: {
    paddingVertical: theme.padding.sm,
  },
});
