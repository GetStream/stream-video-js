import React, { useMemo } from 'react';
import {
  hasScreenShare,
  speakerLayoutSortPreset,
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
import { useIsInPiPMode } from '../../../hooks/useIsInPiPMode';
import { generateMockParticipants } from '.';

/**
 * Props for the CallParticipantsSpotlight component.
 */
export type CallParticipantsSpotlightProps = ParticipantViewComponentProps &
  Pick<
    CallContentProps,
    | 'supportedReactions'
    | 'CallParticipantsList'
    | 'ScreenShareOverlay'
    | 'disablePictureInPicture'
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
  disablePictureInPicture,
}: CallParticipantsSpotlightProps) => {
  const {
    theme: { callParticipantsSpotlight, variants },
  } = useTheme();
  const styles = useStyles(landscape);
  const { useParticipants } = useCallStateHooks();
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  let allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  // allParticipants = generateMockParticipants(10); // for testing
  const [participantInSpotlight, ...otherParticipants] = allParticipants;
  const isScreenShareOnSpotlight =
    participantInSpotlight && hasScreenShare(participantInSpotlight);
  const isUserAloneInCall = allParticipants?.length === 1;

  const isInPiP = useIsInPiPMode(disablePictureInPicture);

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
        (isScreenShareOnSpotlight && ScreenShareOverlay ? (
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

const useStyles = (landscape: boolean | undefined) => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: theme.variants.spacingSizes.xs,
          backgroundColor: theme.colors.sheetPrimary,
        },
        fullScreenSpotlightContainer: {
          flex: 1,
        },
        spotlightContainer: {
          flex: landscape ? 3 : 4,
          overflow: 'hidden',
          borderRadius: theme.variants.borderRadiusSizes.md,
          marginHorizontal: theme.variants.spacingSizes.xs,
        },
        callParticipantsListContainer: {
          flex: 1,
          flexDirection: 'row',
          backgroundColor: theme.colors.sheetPrimary,
          marginLeft: landscape ? theme.variants.spacingSizes.sm : 0,
        },
      }),
    [theme, landscape]
  );
};
