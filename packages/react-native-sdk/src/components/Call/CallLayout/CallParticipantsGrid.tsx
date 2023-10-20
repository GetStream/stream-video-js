import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import {
  CallParticipantsList as DefaultCallParticipantsList,
  CallParticipantsListComponentProps,
} from '../CallParticipantsList/CallParticipantsList';
import { ComponentTestIds } from '../../../constants/TestIds';
import { useTheme } from '../../../contexts/ThemeContext';
import { CallContentProps } from '../CallContent';
import { ParticipantViewComponentProps } from '../../Participant';
import { useIsInPiPMode } from '../../../hooks';

/**
 * Props for the CallParticipantsGrid component.
 */
export type CallParticipantsGridProps = ParticipantViewComponentProps &
  Pick<CallContentProps, 'supportedReactions' | 'CallParticipantsList'> &
  Pick<CallParticipantsListComponentProps, 'ParticipantView'> & {
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
  showLocalParticipant = false,
  supportedReactions,
  landscape,
}: CallParticipantsGridProps) => {
  const {
    theme: { colors, callParticipantsGrid },
  } = useTheme();
  const { useRemoteParticipants, useParticipants, useLocalParticipant } =
    useCallStateHooks();
  const _remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const _allParticipants = useParticipants();
  // we debounce the participants arrays to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300);
  const allParticipants = useDebouncedValue(_allParticipants, 300);
  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  const isInPiPMode = useIsInPiPMode();

  const showFloatingView =
    !isInPiPMode &&
    remoteParticipants.length > 0 &&
    remoteParticipants.length < 3;

  let participants = showFloatingView
    ? showLocalParticipant && localParticipant
      ? [localParticipant]
      : remoteParticipants
    : allParticipants;

  if (isInPiPMode) {
    participants =
      remoteParticipants.length > 0
        ? [remoteParticipants[0]]
        : localParticipant
        ? [localParticipant]
        : [];
  }

  const participantViewProps: CallParticipantsListComponentProps = {
    ParticipantView,
    ParticipantLabel,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback,
    VideoRenderer,
  };

  return (
    <View
      style={[
        styles.container,
        landscapeStyles,
        { backgroundColor: colors.dark_gray },
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
  container: {
    flex: 1,
  },
});
