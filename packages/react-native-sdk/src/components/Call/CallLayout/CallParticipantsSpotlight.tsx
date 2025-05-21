import React, { useMemo } from 'react';
import {
  hasScreenShare,
  speakerLayoutSortPreset,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { ComponentTestIds } from '../../../constants/TestIds';
import {
  CallParticipantsList as DefaultCallParticipantsList,
  type CallParticipantsListComponentProps,
} from '../CallParticipantsList/CallParticipantsList';
import {
  ParticipantView as DefaultParticipantView,
  type ParticipantViewComponentProps,
} from '../../Participant';
import { useTheme } from '../../../contexts/ThemeContext';
import { type CallContentProps } from '../CallContent';
import { useIsInPiPMode } from '../../../hooks/useIsInPiPMode';

/**
 * Props for the CallParticipantsSpotlight component.
 */
export type CallParticipantsSpotlightProps = ParticipantViewComponentProps &
  Pick<
    CallContentProps,
    'supportedReactions' | 'CallParticipantsList' | 'ScreenShareOverlay'
  > &
  Pick<CallParticipantsListComponentProps, 'ParticipantView'> & {
    /**
     * Check if device is in landscape mode.
     * This will apply the landscape mode styles to the component.
     */
    landscape?: boolean;
  };

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
  ScreenShareOverlay,
  VideoRenderer,
  supportedReactions,
  landscape,
}: CallParticipantsSpotlightProps) => {
  const {
    theme: { callParticipantsSpotlight, variants },
  } = useTheme();
  const styles = useStyles();
  const { useParticipants } = useCallStateHooks();
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const [participantInSpotlight, ...otherParticipants] = allParticipants;
  const isScreenShareOnSpotlight =
    participantInSpotlight && hasScreenShare(participantInSpotlight);
  const isUserAloneInCall = _allParticipants?.length === 1;

  const isInPiP = useIsInPiPMode();

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
    marginHorizontal: landscape ? 0 : variants.spacingSizes.xs,
  };

  const showShareScreenOverlay =
    participantInSpotlight?.isLocalParticipant &&
    isScreenShareOnSpotlight &&
    ScreenShareOverlay;

  return (
    <View
      testID={ComponentTestIds.CALL_PARTICIPANTS_SPOTLIGHT}
      style={[
        styles.container,
        landscapeStyles,
        callParticipantsSpotlight.container,
      ]}
    >
      {participantInSpotlight &&
        ParticipantView &&
        (showShareScreenOverlay ? (
          <ScreenShareOverlay />
        ) : (
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
            objectFit={isScreenShareOnSpotlight ? 'contain' : 'cover'}
            trackType={
              isScreenShareOnSpotlight ? 'screenShareTrack' : 'videoTrack'
            }
            supportedReactions={supportedReactions}
            {...participantViewProps}
          />
        ))}
      {!isInPiP && !isUserAloneInCall && (
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

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.sheetPrimary,
        },
        fullScreenSpotlightContainer: {
          flex: 1,
        },
        spotlightContainer: {
          flex: 2,
          overflow: 'hidden',
          borderRadius: theme.variants.borderRadiusSizes.sm,
          marginHorizontal: theme.variants.spacingSizes.sm,
        },
        callParticipantsListContainer: {
          flex: 1,
        },
      }),
    [theme],
  );
};
