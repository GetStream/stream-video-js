import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { debounceTime } from 'rxjs';
import {
  CallParticipantsList as DefaultCallParticipantsList,
  type CallParticipantsListComponentProps,
} from '../CallParticipantsList/CallParticipantsList';
import { ComponentTestIds } from '../../../constants/TestIds';
import { useTheme } from '../../../contexts/ThemeContext';
import type { CallContentProps } from '../CallContent';
import type { ParticipantViewComponentProps } from '../../Participant';
import { useIsInPiPMode } from '../../../hooks/useIsInPiPMode';
import { StreamVideoParticipant } from '@stream-io/video-client';

/**
 * Props for the CallParticipantsGrid component.
 */
export type CallParticipantsGridProps = ParticipantViewComponentProps &
  Pick<CallContentProps, 'supportedReactions' | 'CallParticipantsList'> &
  Pick<CallParticipantsListComponentProps, 'ParticipantView' | 'mirror'> & {
    /**
     * Boolean to decide if local participant will be visible in the grid when there is 1:1 call.
     */
    showLocalParticipant?: boolean;
    /**
     * Check if device is in landscape mode.
     * This will apply the landscape mode styles to the component.
     */
    landscape?: boolean;
  };

/**
 * Component used to display the list of participants in a grid mode.
 */
export const CallParticipantsGrid = ({
  CallParticipantsList = DefaultCallParticipantsList,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  VideoRenderer,
  mirror,
  showLocalParticipant = false,
  supportedReactions,
  landscape,
}: CallParticipantsGridProps) => {
  const {
    theme: { colors, callParticipantsGrid },
  } = useTheme();
  const call = useCall();
  const { useLocalParticipant, useDominantSpeaker } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const dominantSpeaker = useDominantSpeaker();
  const [remoteParticipants, setRemoteParticipants] = useState<
    StreamVideoParticipant[]
  >(() => call?.state.remoteParticipants ?? []);
  const [allParticipants, setAllParticipants] = useState<
    StreamVideoParticipant[]
  >(() => call?.state.participants ?? []);
  useEffect(() => {
    if (!call) {
      setRemoteParticipants([]);
      setAllParticipants([]);
      return;
    }
    const sub1 = call.state.remoteParticipants$
      .pipe(debounceTime(300))
      .subscribe(setRemoteParticipants);
    const sub2 = call.state.participants$
      .pipe(debounceTime(300))
      .subscribe(setAllParticipants);
    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }, [call]);
  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  const isInPiPMode = useIsInPiPMode();

  const showFloatingView =
    !isInPiPMode &&
    remoteParticipants.length > 0 &&
    remoteParticipants.length < 3;

  let participants: StreamVideoParticipant[];

  if (showFloatingView) {
    if (showLocalParticipant && localParticipant) {
      participants = [localParticipant];
    } else {
      participants = remoteParticipants;
    }
  } else {
    participants = allParticipants;
  }

  if (isInPiPMode) {
    if (dominantSpeaker && !dominantSpeaker.isLocalParticipant) {
      participants = [dominantSpeaker];
    } else if (remoteParticipants[0]) {
      participants = [remoteParticipants[0]];
    } else if (localParticipant) {
      participants = [localParticipant];
    } else {
      participants = [];
    }
  }

  const participantViewProps: CallParticipantsListComponentProps = {
    ParticipantView,
    ParticipantLabel,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback,
    VideoRenderer,
    mirror,
  };

  return (
    <View
      style={[
        styles.container,
        landscapeStyles,
        { backgroundColor: colors.sheetPrimary },
        callParticipantsGrid.container,
      ]}
      testID={ComponentTestIds.CALL_PARTICIPANTS_GRID}
    >
      {CallParticipantsList && (
        <CallParticipantsList
          participants={participants}
          supportedReactions={supportedReactions}
          landscape={landscape}
          {...participantViewProps}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
