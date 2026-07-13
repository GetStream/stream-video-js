import React, { useEffect, useMemo, useState } from 'react';
import {
  hasScreenShare,
  type StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { debounceTime } from 'rxjs';
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
import { useSpeakerLayoutSortPreset } from '../../../hooks/useSpeakerLayoutSortPreset';

/**
 * Props for the CallParticipantsSpotlight component.
 */
export type CallParticipantsSpotlightProps = ParticipantViewComponentProps &
  Pick<
    CallContentProps,
    'supportedReactions' | 'CallParticipantsList' | 'ScreenShareOverlay'
  > &
  Pick<CallParticipantsListComponentProps, 'ParticipantView' | 'mirror'> & {
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
  mirror,
  landscape,
}: CallParticipantsSpotlightProps) => {
  const {
    theme: { callParticipantsSpotlight, variants },
  } = useTheme();
  const styles = useStyles();
  const call = useCall();
  const [allParticipants, setAllParticipants] = useState<
    StreamVideoParticipant[]
  >(() => call?.state.participants ?? []);
  useEffect(() => {
    if (!call) {
      setAllParticipants([]);
      return;
    }
    const sub = call.state.participants$
      .pipe(debounceTime(300))
      .subscribe(setAllParticipants);
    return () => sub.unsubscribe();
  }, [call]);
  const isOneOnOneCall = allParticipants.length === 2;
  useSpeakerLayoutSortPreset(call, isOneOnOneCall);
  const [participantInSpotlight, ...otherParticipants] = allParticipants;
  const isScreenShareOnSpotlight =
    participantInSpotlight && hasScreenShare(participantInSpotlight);
  const isUserAloneInCall = allParticipants.length === 1;

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
    mirror,
  };

  // Memoized so the spotlight tile's `style` prop stays referentially stable;
  // otherwise the fresh array literal defeats ParticipantView's React.memo.
  const spotlightParticipantStyle = useMemo(
    () =>
      isUserAloneInCall
        ? [
            styles.fullScreenSpotlightContainer,
            callParticipantsSpotlight.fullScreenSpotlightContainer,
          ]
        : [
            styles.spotlightContainer,
            { marginHorizontal: landscape ? 0 : variants.spacingSizes.xs },
            callParticipantsSpotlight.spotlightContainer,
          ],
    [
      isUserAloneInCall,
      landscape,
      styles,
      callParticipantsSpotlight,
      variants.spacingSizes.xs,
    ],
  );

  const showShareScreenOverlay =
    participantInSpotlight?.isLocalParticipant &&
    isScreenShareOnSpotlight &&
    ScreenShareOverlay;

  return (
    <View
      testID={ComponentTestIds.CALL_PARTICIPANTS_SPOTLIGHT}
      style={[
        styles.container,
        landscape ? landscapeStyles.row : landscapeStyles.column,
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
            style={spotlightParticipantStyle}
            objectFit={isScreenShareOnSpotlight ? 'contain' : 'cover'}
            trackType={
              isScreenShareOnSpotlight ? 'screenShareTrack' : 'videoTrack'
            }
            supportedReactions={supportedReactions}
            mirror={mirror}
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

const landscapeStyles = StyleSheet.create({
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
});

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
