import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CallTopView as DefaultCallTopView,
  CallTopViewProps,
} from '../CallTopView';
import {
  CallParticipantsGrid,
  CallParticipantsGridProps,
  CallParticipantsSpotlight,
  CallParticipantsSpotlightProps,
} from '../CallLayout';
import {
  CallControlProps,
  CallControls as DefaultCallControls,
} from '../CallControls';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { useIncallManager } from '../../../hooks';
import { CallParticipantsListComponentProps } from '../CallParticipantsList';
import { ParticipantViewComponentProps } from '../../Participant';
import { useTheme } from '../../../contexts';

export type CallParticipantsComponentProps =
  CallParticipantsListComponentProps &
    Pick<
      CallParticipantsGridProps,
      'CallParticipantsList' | 'LocalParticipantView'
    > & {
      /**
       * Component to customize the CallTopView component.
       */
      CallTopView?: React.ComponentType<CallTopViewProps> | null;
      /**
       * Component to customize the CallControls component.
       */
      CallControls?: React.ComponentType<CallControlProps> | null;
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
  CallParticipantsList,
  CallTopView = DefaultCallTopView,
  CallControls = DefaultCallControls,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  ParticipantsInfoBadge,
  LocalParticipantView,
  VideoRenderer,
  layout,
}: CallContentProps) => {
  const {
    theme: { callContent },
  } = useTheme();
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

  const participantViewProps: ParticipantViewComponentProps = {
    ParticipantLabel,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback,
    VideoRenderer,
  };

  const callParticipantsGridProps: CallParticipantsGridProps = {
    ...participantViewProps,
    ParticipantView,
    CallParticipantsList,
    LocalParticipantView,
  };

  const callParticipantsSpotlightProps: CallParticipantsSpotlightProps = {
    ...participantViewProps,
    ParticipantView,
    CallParticipantsList,
  };

  return (
    <View style={[styles.container, callContent.container]}>
      <View style={[styles.container, callContent.callParticipantsContainer]}>
        {CallTopView && (
          <CallTopView
            onBackPressed={onBackPressed}
            onParticipantInfoPress={onParticipantInfoPress}
            ParticipantsInfoBadge={ParticipantsInfoBadge}
          />
        )}
        {showSpotlightLayout ? (
          <CallParticipantsSpotlight {...callParticipantsSpotlightProps} />
        ) : (
          <CallParticipantsGrid {...callParticipantsGridProps} />
        )}
      </View>
      {CallControls && (
        <CallControls onHangupCallHandler={onHangupCallHandler} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
