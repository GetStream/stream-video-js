import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
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
import { Z_INDEX } from '../../../constants';
import { useDebouncedValue } from '../../../utils/hooks';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  FloatingParticipantViewProps,
  ParticipantViewComponentProps,
} from '../../Participant';
import { useTheme } from '../../../contexts';

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
  CallTopView?: React.ComponentType<CallTopViewProps> | null;
  /**
   * Component to customize the CallControls component.
   */
  CallControls?: React.ComponentType<CallControlProps> | null;
  /**
   * Component to customize the FloatingParticipantView.
   */
  FloatingParticipantView?: React.ComponentType<FloatingParticipantViewProps> | null;
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
    /**
     * Check if phone is in landscape mode.
     */
    landscape?: boolean;
  };

export const CallContent = ({
  onBackPressed,
  onParticipantInfoPress,
  onHangupCallHandler,
  CallParticipantsList,
  CallTopView = DefaultCallTopView,
  CallControls = DefaultCallControls,
  FloatingParticipantView = DefaultFloatingParticipantView,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  ParticipantsInfoBadge,
  VideoRenderer,
  layout = 'grid',
  landscape = false,
}: CallContentProps) => {
  const [
    showRemoteParticipantInFloatingView,
    setShowRemoteParticipantInFloatingView,
  ] = useState<boolean>(false);
  const {
    theme: { callContent },
  } = useTheme();
  const {
    useHasOngoingScreenShare,
    useRemoteParticipants,
    useLocalParticipant,
  } = useCallStateHooks();

  const _remoteParticipants = useRemoteParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const localParticipant = useLocalParticipant();

  const hasScreenShare = useHasOngoingScreenShare();
  const showSpotlightLayout = hasScreenShare || layout === 'spotlight';

  const showFloatingView =
    !showSpotlightLayout &&
    remoteParticipants.length > 0 &&
    remoteParticipants.length < 3;
  const isRemoteParticipantInFloatingView =
    showRemoteParticipantInFloatingView && remoteParticipants.length === 1;

  /**
   * This hook is used to handle IncallManager specs of the application.
   */
  useIncallManager({ media: 'video', auto: true });

  const call = useCall();
  const activeCallRef = useRef(call);
  activeCallRef.current = call;

  const handleFloatingViewParticipantSwitch = () => {
    if (remoteParticipants.length !== 1) {
      return;
    }
    setShowRemoteParticipantInFloatingView((prevState) => !prevState);
  };

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
    landscape,
    showLocalParticipant: isRemoteParticipantInFloatingView,
    ParticipantView,
    CallParticipantsList,
  };

  const callParticipantsSpotlightProps: CallParticipantsSpotlightProps = {
    ...participantViewProps,
    landscape,
    ParticipantView,
    CallParticipantsList,
  };

  const landScapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <View style={[styles.container, callContent.container, landScapeStyles]}>
      <View style={[styles.container, callContent.callParticipantsContainer]}>
        <View
          style={[styles.view, callContent.topContainer]}
          // "box-none" disallows the container view to be not take up touches
          // and allows only the top and floating view (its child views) to take up the touches
          pointerEvents="box-none"
        >
          {CallTopView && (
            <CallTopView
              onBackPressed={onBackPressed}
              onParticipantInfoPress={onParticipantInfoPress}
              ParticipantsInfoBadge={ParticipantsInfoBadge}
            />
          )}
          {showFloatingView && FloatingParticipantView && (
            <FloatingParticipantView
              participant={
                isRemoteParticipantInFloatingView
                  ? remoteParticipants[0]
                  : localParticipant
              }
              onPressHandler={handleFloatingViewParticipantSwitch}
              {...participantViewProps}
            />
          )}
        </View>
        {showSpotlightLayout ? (
          <CallParticipantsSpotlight {...callParticipantsSpotlightProps} />
        ) : (
          <CallParticipantsGrid {...callParticipantsGridProps} />
        )}
      </View>

      {CallControls && (
        <CallControls
          onHangupCallHandler={onHangupCallHandler}
          landscape={landscape}
        />
      )}
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
