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
import {
  LocalParticipantView as DefaultLocalParticipantView,
  LocalParticipantViewProps,
} from '../../Participant';
import { theme } from '../../../theme';

/**
 * Props for the CallParticipantsGrid component.
 */
export type CallParticipantsGridProps = CallParticipantsListComponentProps & {
  /**
   * Component to customize the LocalParticipantView.
   */
  LocalParticipantView?: React.ComponentType<LocalParticipantViewProps> | null;
  /**
   * Component to customize the CallParticipantsList.
   */
  CallParticipantsList?: React.ComponentType<CallParticipantsListProps> | null;
};

/**
 * Component used to display the list of participants in a grid mode.
 */
export const CallParticipantsGrid = ({
  CallParticipantsList = DefaultCallParticipantsList,
  LocalParticipantView = DefaultLocalParticipantView,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  VideoRenderer,
}: CallParticipantsGridProps) => {
  const { useRemoteParticipants, useParticipants } = useCallStateHooks();
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const showFloatingView =
    remoteParticipants.length > 0 && remoteParticipants.length < 3;

  const participants = showFloatingView ? remoteParticipants : allParticipants;

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
      style={styles.container}
      testID={ComponentTestIds.CALL_PARTICIPANTS_GRID}
    >
      {showFloatingView && LocalParticipantView && (
        <LocalParticipantView {...participantViewProps} />
      )}
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
    backgroundColor: theme.light.dark_gray,
  },
});
