import React from 'react';
import {
  SfuModels,
  StreamVideoParticipant,
  speakerLayoutSortPreset,
} from '@stream-io/video-client';
import {
  useParticipants,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { Participant } from '../../participants/Participant';
import { theme } from '../../../theme';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { ComponentTestIds } from '../../../constants/TestIds';
import { CallParticipantsList } from '../../call/CallParticipantsList';
import { LocalParticipantView } from '../../participants';

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

export const CallParticipantsSpotlight = () => {
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const [participantInSpotlight, ...otherParticipants] = allParticipants;
  const isScreenShareOnSpotlight = hasScreenShare(participantInSpotlight);
  const isUserAloneInCall = _remoteParticipants?.length === 0;

  if (isUserAloneInCall) {
    return <LocalParticipantView layout={'fullscreen'} />;
  }

  return (
    <View
      testID={ComponentTestIds.CALL_PARTICIPANTS_SPOTLIGHT}
      style={styles.container}
    >
      {participantInSpotlight && (
        <Participant
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
