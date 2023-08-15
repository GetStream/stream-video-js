import React from 'react';
import {
  SfuModels,
  speakerLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../../theme';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { ComponentTestIds } from '../../../constants/TestIds';
import { CallParticipantsListProps } from '../CallParticipantsList/CallParticipantsList';
import { LocalParticipantView } from '../../Participant';

/**
 * Props for the CallParticipantsSpotlight component.
 */
export type CallParticipantsSpotlightProps = Pick<
  CallParticipantsListProps,
  | 'ParticipantLabel'
  | 'ParticipantNetworkQualityIndicator'
  | 'ParticipantReaction'
  | 'ParticipantVideoFallback'
  | 'ParticipantView'
  | 'VideoRenderer'
> & {
  /**
   * Component to customize the CallParticipantsList.
   */
  CallParticipantsList?: React.ComponentType<CallParticipantsListProps>;
};

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

/**
 * Component used to display the list of participants in a spotlight mode.
 * This can be used when you want to render the screen sharing stream.
 */
export const CallParticipantsSpotlight = ({
  CallParticipantsList,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  VideoRenderer,
}: CallParticipantsSpotlightProps) => {
  const { useParticipants, useRemoteParticipants } = useCallStateHooks();
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
      {participantInSpotlight && ParticipantView && (
        <ParticipantView
          participant={participantInSpotlight}
          style={styles.participantView}
          videoMode={isScreenShareOnSpotlight ? 'screen' : 'video'}
          ParticipantLabel={ParticipantLabel}
          ParticipantNetworkQualityIndicator={
            ParticipantNetworkQualityIndicator
          }
          ParticipantReaction={ParticipantReaction}
          ParticipantVideoFallback={ParticipantVideoFallback}
          VideoRenderer={VideoRenderer}
        />
      )}
      <View style={styles.participantVideoContainer}>
        {CallParticipantsList && (
          <CallParticipantsList
            participants={
              isScreenShareOnSpotlight ? allParticipants : otherParticipants
            }
            horizontal
            ParticipantLabel={ParticipantLabel}
            ParticipantNetworkQualityIndicator={
              ParticipantNetworkQualityIndicator
            }
            ParticipantReaction={ParticipantReaction}
            ParticipantVideoFallback={ParticipantVideoFallback}
            ParticipantView={ParticipantView}
            VideoRenderer={VideoRenderer}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: theme.padding.sm,
    backgroundColor: theme.light.static_grey,
  },
  participantView: {
    flex: 2,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
    marginHorizontal: theme.padding.sm,
    marginBottom: theme.padding.sm,
  },
  participantVideoContainer: {
    flex: 1,
  },
});
