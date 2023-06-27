import React from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { theme } from '../theme';
import { useDebouncedValue } from '../utils/hooks/useDebouncedValue';
import { CallParticipantsList } from './CallParticipantsList';
import { speakerLayoutSortPreset } from '@stream-io/video-client';
import { A11yComponents } from '../constants/A11yLabels';

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
    <View
      accessibilityLabel={A11yComponents.CALL_PARTICIPANTS_SPOTLIGHT_VIEW}
      style={styles.container}
    >
      {participantInSpotlight && (
        <ParticipantView
          participant={participantInSpotlight}
          containerStyle={styles.participantView}
          kind={isScreenShareOnSpotlight ? 'screen' : 'video'}
        />
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
  participantView: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
    marginHorizontal: theme.padding.sm,
  },
  participantVideoContainer: {
    paddingVertical: theme.padding.sm,
  },
});
