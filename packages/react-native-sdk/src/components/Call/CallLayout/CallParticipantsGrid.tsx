import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import {
  CallParticipantsList as DefaultCallParticipantsList,
  CallParticipantsListProps,
  CallParticipantsListComponentProps,
} from '../CallParticipantsList/CallParticipantsList';
import { ComponentTestIds } from '../../../constants/TestIds';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the CallParticipantsGrid component.
 */
export type CallParticipantsGridProps = CallParticipantsListComponentProps & {
  /**
   * Component to customize the CallParticipantsList.
   */
  CallParticipantsList?: React.ComponentType<CallParticipantsListProps> | null;
  /**
   * Boolean to decide if local participant will be visible in the grid when there is 1:1 call.
   */
  showLocalParticipant?: boolean;
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
}: CallParticipantsGridProps) => {
  const {
    theme: { colors, callParticipantsGrid },
  } = useTheme();
  const { useRemoteParticipants, useParticipants, useLocalParticipant } =
    useCallStateHooks();
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const localParticipant = useLocalParticipant();

  const showFloatingView =
    remoteParticipants.length > 0 && remoteParticipants.length < 3;

  const participants = showFloatingView
    ? showLocalParticipant && localParticipant
      ? [localParticipant]
      : remoteParticipants
    : allParticipants;

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
        { backgroundColor: colors.dark_gray },
        callParticipantsGrid.container,
      ]}
      testID={ComponentTestIds.CALL_PARTICIPANTS_GRID}
    >
      {CallParticipantsList && (
        <CallParticipantsList
          participants={participants}
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
