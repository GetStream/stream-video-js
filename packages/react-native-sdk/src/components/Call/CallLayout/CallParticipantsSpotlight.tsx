import React from 'react';
import {
  SfuModels,
  speakerLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { ComponentTestIds } from '../../../constants/TestIds';
import {
  CallParticipantsList as DefaultCallParticipantsList,
  CallParticipantsListProps,
  CallParticipantsListComponentProps,
} from '../CallParticipantsList/CallParticipantsList';
import {
  ParticipantView as DefaultParticipantView,
  ParticipantViewComponentProps,
} from '../../Participant';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the CallParticipantsSpotlight component.
 */
export type CallParticipantsSpotlightProps =
  CallParticipantsListComponentProps & {
    /**
     * Component to customize the CallParticipantsList.
     */
    CallParticipantsList?: React.ComponentType<CallParticipantsListProps> | null;
  };

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

/**
 * Component used to display the list of participants in a spotlight mode.
 * This can be used when you want to render the screen sharing stream.
 */
export const CallParticipantsSpotlight = ({
  CallParticipantsList = DefaultCallParticipantsList,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView = DefaultParticipantView,
  VideoRenderer,
}: CallParticipantsSpotlightProps) => {
  const {
    theme: { colors, callParticipantsSpotlight },
  } = useTheme();
  const { useParticipants, useRemoteParticipants } = useCallStateHooks();
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const [participantInSpotlight, ...otherParticipants] = allParticipants;
  const isScreenShareOnSpotlight = hasScreenShare(participantInSpotlight);
  const isUserAloneInCall = _remoteParticipants?.length === 0;

  const participantViewProps: ParticipantViewComponentProps = {
    ParticipantLabel,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback,
    VideoRenderer,
  };

  const callParticipantsListProps: CallParticipantsListComponentProps = {
    ...participantViewProps,
    ParticipantView,
  };

  return (
    <View
      testID={ComponentTestIds.CALL_PARTICIPANTS_SPOTLIGHT}
      style={[
        styles.container,
        {
          backgroundColor: colors.dark_gray,
        },
        callParticipantsSpotlight.container,
      ]}
    >
      {participantInSpotlight && ParticipantView && (
        <ParticipantView
          participant={participantInSpotlight}
          style={
            isUserAloneInCall
              ? [
                  styles.fullScreenSpotlightContainer,
                  callParticipantsSpotlight.fullScreenSpotlightContainer,
                ]
              : [
                  styles.spotlightContainer,
                  callParticipantsSpotlight.spotlightContainer,
                ]
          }
          videoMode={isScreenShareOnSpotlight ? 'screen' : 'video'}
          {...participantViewProps}
        />
      )}
      {!isUserAloneInCall && (
        <View style={styles.callParticipantsListContainer}>
          {CallParticipantsList && (
            <CallParticipantsList
              participants={
                isScreenShareOnSpotlight ? allParticipants : otherParticipants
              }
              horizontal
              {...callParticipantsListProps}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  fullScreenSpotlightContainer: {
    flex: 1,
  },
  spotlightContainer: {
    flex: 2,
    overflow: 'hidden',
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  callParticipantsListContainer: {
    flex: 1,
  },
});
