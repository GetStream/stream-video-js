import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import {
  CallParticipantsList,
  CallParticipantsListProps,
} from '../CallParticipantsList/CallParticipantsList';
import { ComponentTestIds } from '../../../constants/TestIds';
import {
  ParticipantNetworkQualityIndicator as DefaultParticipantNetworkQualityIndicator,
  ParticipantReaction as DefaultParticipantReaction,
  ParticipantLabel as DefaultParticipantLabel,
  ParticipantVideoFallback as DefaultParticipantVideoFallback,
  VideoRenderer as DefaultVideoRenderer,
  ParticipantView as DefaultParticipantView,
  LocalParticipantView as DefaultLocalParticipantView,
  LocalParticipantViewProps,
} from '../../Participant';

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
   * Component to customize the local participant view.
   */
  LocalParticipantView?: React.ComponentType<LocalParticipantViewProps>;
};

/**
 * Component used to display the list of participants in a grid mode.
 */
export const CallParticipantsGrid = ({
  ParticipantLabel = DefaultParticipantLabel,
  ParticipantNetworkQualityIndicator = DefaultParticipantNetworkQualityIndicator,
  ParticipantReaction = DefaultParticipantReaction,
  ParticipantVideoFallback = DefaultParticipantVideoFallback,
  ParticipantView = DefaultParticipantView,
  VideoRenderer = DefaultVideoRenderer,
  LocalParticipantView = DefaultLocalParticipantView,
}: CallParticipantsGridProps) => {
  const { useRemoteParticipants, useParticipants } = useCallStateHooks();
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const showFloatingView = remoteParticipants.length < 3;
  const isUserAloneInCall = remoteParticipants?.length === 0;
  const participants = showFloatingView ? remoteParticipants : allParticipants;

  if (showFloatingView && isUserAloneInCall) {
    return <LocalParticipantView layout={'fullscreen'} />;
  }

  return (
    <View
      style={styles.container}
      testID={ComponentTestIds.CALL_PARTICIPANTS_GRID}
    >
      {showFloatingView && <LocalParticipantView layout={'floating'} />}
      <CallParticipantsList
        participants={participants}
        ParticipantLabel={ParticipantLabel}
        ParticipantNetworkQualityIndicator={ParticipantNetworkQualityIndicator}
        ParticipantReaction={ParticipantReaction}
        ParticipantVideoFallback={ParticipantVideoFallback}
        ParticipantView={ParticipantView}
        VideoRenderer={VideoRenderer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
