import React from 'react';
import {
  SfuModels,
  StreamVideoParticipant,
  speakerLayoutSortPreset,
} from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { ParticipantView } from '../../participants/ParticipantView';
import { theme } from '../../../theme';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { A11yComponents } from '../../../constants/A11yLabels';
import { CallParticipantsListView } from '../../call/CallParticipantsListView';

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
        <CallParticipantsListView
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
    flex: 2,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
    marginHorizontal: theme.padding.sm,
  },
  participantVideoContainer: {
    flex: 1,
    paddingVertical: theme.padding.sm,
  },
});
