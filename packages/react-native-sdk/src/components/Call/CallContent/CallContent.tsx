import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CallTopView as DefaultCallTopView,
  CallTopViewProps,
  ParticipantsInfoBadge as DefaultParticipantsInfoBadge,
} from '../CallTopView';
import {
  CallParticipantsGrid,
  CallParticipantsGridProps,
  CallParticipantsSpotlight,
} from '../CallLayout';
import {
  CallControlProps,
  CallControls as DefaultCallControls,
} from '../CallControls';
import { CallParticipantsList as DefaultCallParticipantsList } from '../CallParticipantsList';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  LocalParticipantView as DefaultLocalParticipantView,
  LocalParticipantViewProps,
  ParticipantLabel as DefaultParticipantLabel,
  ParticipantNetworkQualityIndicator as DefaultParticipantNetworkQualityIndicator,
  ParticipantReaction as DefaultParticipantReaction,
  ParticipantVideoFallback as DefaultParticipantVideoFallback,
  ParticipantView as DefaultParticipantView,
  VideoRenderer as DefaultVideoRenderer,
} from '../../Participant';
import { CallingState } from '@stream-io/video-client';
import { useIncallManager } from '../../../hooks';
import { Z_INDEX } from '../../../constants';
import { useDebouncedValue } from '../../../utils/hooks';

export type CallParticipantsComponentProps = Pick<
  CallParticipantsGridProps,
  | 'CallParticipantsList'
  | 'ParticipantLabel'
  | 'ParticipantNetworkQualityIndicator'
  | 'ParticipantReaction'
  | 'ParticipantVideoFallback'
  | 'ParticipantView'
  | 'VideoRenderer'
> & {
  /**
   * Component to customize the CallTopView component.
   */
  CallTopView?: React.ComponentType<CallTopViewProps>;
  /**
   * Component to customize the CallControls component.
   */
  CallControls?: React.ComponentType<CallControlProps>;
  /**
   * Component to customize the LocalParticipantView.
   */
  LocalParticipantView?: React.ComponentType<LocalParticipantViewProps>;
};

export type CallContentProps = Pick<CallControlProps, 'onHangupCallHandler'> &
  Pick<
    CallTopViewProps,
    'onBackPressed' | 'onParticipantInfoPress' | 'ParticipantsInfoBadge'
  > &
  CallParticipantsComponentProps & {
    /**
     * This switches the participant's layout between the grid and the spotlight mode.
     */
    layout?: 'grid' | 'spotlight';
  };

export const CallContent = ({
  onBackPressed,
  onParticipantInfoPress,
  onHangupCallHandler,
  CallParticipantsList = DefaultCallParticipantsList,
  LocalParticipantView = DefaultLocalParticipantView,
  ParticipantLabel = DefaultParticipantLabel,
  ParticipantNetworkQualityIndicator = DefaultParticipantNetworkQualityIndicator,
  ParticipantReaction = DefaultParticipantReaction,
  ParticipantVideoFallback = DefaultParticipantVideoFallback,
  ParticipantView = DefaultParticipantView,
  ParticipantsInfoBadge = DefaultParticipantsInfoBadge,
  VideoRenderer = DefaultVideoRenderer,
  CallTopView = DefaultCallTopView,
  CallControls = DefaultCallControls,
  layout,
}: CallContentProps) => {
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  const { useRemoteParticipants } = useCallStateHooks();

  const _remoteParticipants = useRemoteParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const showFloatingView =
    remoteParticipants.length > 0 && remoteParticipants.length < 3;

  const showSpotlightLayout = hasScreenShare || layout === 'spotlight';

  /**
   * This hook is used to handle IncallManager specs of the application.
   */
  useIncallManager({ media: 'video', auto: true });

  const call = useCall();
  const activeCallRef = useRef(call);
  activeCallRef.current = call;

  useEffect(() => {
    return () => {
      if (activeCallRef.current?.state.callingState !== CallingState.LEFT) {
        activeCallRef.current?.leave();
      }
    };
  }, []);

  const participantViewProps: CallParticipantsComponentProps = {
    CallParticipantsList,
    LocalParticipantView,
    ParticipantLabel,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback,
    ParticipantView,
    VideoRenderer,
  };

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <View style={styles.view}>
          <CallTopView
            onBackPressed={onBackPressed}
            onParticipantInfoPress={onParticipantInfoPress}
            ParticipantsInfoBadge={ParticipantsInfoBadge}
          />
          {showFloatingView && LocalParticipantView && (
            <LocalParticipantView {...participantViewProps} />
          )}
        </View>

        {showSpotlightLayout ? (
          <CallParticipantsSpotlight {...participantViewProps} />
        ) : (
          <CallParticipantsGrid {...participantViewProps} />
        )}
      </View>
      <CallControls onHangupCallHandler={onHangupCallHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  view: {
    ...StyleSheet.absoluteFillObject,
    zIndex: Z_INDEX.IN_FRONT,
  },
});
