import React, { useEffect, useRef, useState } from 'react';
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
  ParticipantLabel as DefaultParticipantLabel,
  ParticipantNetworkQualityIndicator as DefaultParticipantNetworkQualityIndicator,
  ParticipantReaction as DefaultParticipantReaction,
  ParticipantVideoFallback as DefaultParticipantVideoFallback,
  ParticipantView as DefaultParticipantView,
  VideoRenderer as DefaultVideoRenderer,
} from '../../Participant';
import { CallingState } from '@stream-io/video-client';
import { useIncallManager } from '../../../hooks';

export type CallParticipantsComponentProps = Pick<
  CallParticipantsGridProps,
  | 'CallParticipantsList'
  | 'LocalParticipantView'
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
  const [callTopViewHeight, setCallTopViewHeight] = useState<number>(0);
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
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
        <CallTopView
          callTopViewHeight={callTopViewHeight}
          setCallTopViewHeight={setCallTopViewHeight}
          onBackPressed={onBackPressed}
          onParticipantInfoPress={onParticipantInfoPress}
          ParticipantsInfoBadge={ParticipantsInfoBadge}
        />
        {showSpotlightLayout ? (
          <CallParticipantsSpotlight {...participantViewProps} />
        ) : (
          <CallParticipantsGrid
            {...participantViewProps}
            topInset={callTopViewHeight}
          />
        )}
      </View>
      <CallControls onHangupCallHandler={onHangupCallHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
