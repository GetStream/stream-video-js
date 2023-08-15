import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { CallParticipantsListProps } from '../CallParticipantsList/CallParticipantsList';
import { ComponentTestIds } from '../../../constants/TestIds';
import { LocalParticipantViewProps } from '../../Participant';

/**
 * Props for the CallParticipantsGrid component.
 */
export type CallParticipantsGridProps = Pick<
  CallParticipantsListProps,
  | 'ParticipantLabel'
  | 'ParticipantNetworkQualityIndicator'
  | 'ParticipantReaction'
  | 'ParticipantVideoFallback'
  | 'ParticipantView'
  | 'VideoRenderer'
> & {
  /**
   * Component to customize the LocalParticipantView.
   */
  LocalParticipantView?: React.ComponentType<LocalParticipantViewProps>;
  /**
   * Component to customize the CallParticipantsList.
   */
  CallParticipantsList?: React.ComponentType<CallParticipantsListProps>;
};

/**
 * Component used to display the list of participants in a grid mode.
 */
export const CallParticipantsGrid = ({
  CallParticipantsList,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  VideoRenderer,
  LocalParticipantView,
}: CallParticipantsGridProps) => {
  const { useRemoteParticipants, useParticipants } = useCallStateHooks();
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const showFloatingView =
    remoteParticipants.length > 0 && remoteParticipants.length < 3;

  const participants = showFloatingView ? remoteParticipants : allParticipants;

  return (
    <View
      style={styles.container}
      testID={ComponentTestIds.CALL_PARTICIPANTS_GRID}
    >
      {showFloatingView && LocalParticipantView && <LocalParticipantView />}
      {CallParticipantsList && (
        <CallParticipantsList
          participants={participants}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
