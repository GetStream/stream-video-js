import React from 'react';
import {
  SfuModels,
  speakerLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { ComponentTestIds } from '../../../constants/TestIds';
import {
  CallParticipantsList as DefaultCallParticipantsList,
  CallParticipantsListComponentProps,
} from '../CallParticipantsList/CallParticipantsList';
import {
  ParticipantView as DefaultParticipantView,
  ParticipantViewComponentProps,
} from '../../Participant';
import { useTheme } from '../../../contexts/ThemeContext';
import { CallContentProps } from '../CallContent';

/**
 * Props for the CallParticipantsSpotlight component.
 */
export type CallParticipantsSpotlightProps = ParticipantViewComponentProps &
  Pick<CallContentProps, 'supportedReactions' | 'CallParticipantsList'> &
  Pick<CallParticipantsListComponentProps, 'ParticipantView'> & {
    /**
     * Check if device is in landscape mode.
     * This will apply the landscape mode styles to the component.
     */
    landscape?: boolean;
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
  supportedReactions,
  landscape,
}: CallParticipantsSpotlightProps) => {
  const {
    theme: { colors, callParticipantsSpotlight },
  } = useTheme();
  const { useParticipants } = useCallStateHooks();
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const [participantInSpotlight, ...otherParticipants] = allParticipants;
  const isScreenShareOnSpotlight = hasScreenShare(participantInSpotlight);
  const isUserAloneInCall = _allParticipants?.length === 1;

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

  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  const spotlightContainerLandscapeStyles: ViewStyle = {
    marginHorizontal: landscape ? 0 : 8,
  };

  return (
    <View
      testID={ComponentTestIds.CALL_PARTICIPANTS_SPOTLIGHT}
      style={[
        styles.container,
        landscapeStyles,
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
                  spotlightContainerLandscapeStyles,
                  callParticipantsSpotlight.spotlightContainer,
                ]
          }
          trackType={
            isScreenShareOnSpotlight ? 'screenShareTrack' : 'videoTrack'
          }
          supportedReactions={supportedReactions}
          {...participantViewProps}
        />
      )}
      {!isUserAloneInCall && (
        <View
          style={[
            styles.callParticipantsListContainer,
            callParticipantsSpotlight.callParticipantsListContainer,
          ]}
        >
          {CallParticipantsList && (
            <CallParticipantsList
              participants={
                isScreenShareOnSpotlight ? allParticipants : otherParticipants
              }
              supportedReactions={supportedReactions}
              horizontal={!landscape}
              numberOfColumns={!landscape ? 2 : 1}
              landscape={landscape}
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
  },
  fullScreenSpotlightContainer: {
    flex: 1,
  },
  spotlightContainer: {
    flex: 2,
    overflow: 'hidden',
    borderRadius: 10,
    marginHorizontal: 8,
  },
  callParticipantsListContainer: {
    flex: 1,
  },
});
