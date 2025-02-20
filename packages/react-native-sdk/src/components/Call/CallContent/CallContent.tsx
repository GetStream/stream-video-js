import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import {
  CallParticipantsGrid,
  CallParticipantsGridProps,
  CallParticipantsSpotlight,
  CallParticipantsSpotlightProps,
} from '../CallLayout';
import {
  CallControlProps,
  CallControls as DefaultCallControls,
  HangUpCallButtonProps,
} from '../CallControls';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { StreamReaction } from '@stream-io/video-client';

import { Z_INDEX } from '../../../constants';
import { useDebouncedValue } from '../../../utils/hooks';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  FloatingParticipantViewProps,
  ParticipantViewComponentProps,
} from '../../Participant';
import { useTheme } from '../../../contexts';
import {
  CallParticipantsListComponentProps,
  CallParticipantsListProps,
} from '../CallParticipantsList';
import { useIsInPiPMode, useAutoEnterPiPEffect } from '../../../hooks';
import {
  ScreenShareOverlay as DefaultScreenShareOverlay,
  ScreenShareOverlayProps,
} from '../../utility/ScreenShareOverlay';
import RTCViewPipIOS from './RTCViewPipIOS';

export type StreamReactionType = StreamReaction & {
  icon: string;
};

type CallContentComponentProps = ParticipantViewComponentProps &
  Pick<CallParticipantsListComponentProps, 'ParticipantView'> & {
    /**
     * Component to customize the CallControls component.
     */
    CallControls?: React.ComponentType<CallControlProps> | null;
    /**
     * Component to customize the FloatingParticipantView.
     */
    FloatingParticipantView?: React.ComponentType<FloatingParticipantViewProps> | null;
    /**
     * Component to customize the CallParticipantsList.
     */
    CallParticipantsList?: React.ComponentType<CallParticipantsListProps> | null;
    /**
     * Component to customize the ScreenShareOverlay.
     */
    ScreenShareOverlay?: React.ComponentType<ScreenShareOverlayProps> | null;
  };

export type CallContentProps = Pick<
  HangUpCallButtonProps,
  'onHangupCallHandler'
> &
  CallContentComponentProps & {
    /**
     * This switches the participant's layout between the grid and the spotlight mode.
     */
    layout?: 'grid' | 'spotlight';
    /**
     * Reactions that are to be supported in the call
     */
    supportedReactions?: StreamReactionType[];
    /*
     * Check if device is in landscape mode.
     * This will apply the landscape mode styles to the component.
     */
    landscape?: boolean;
    /*
     * If true, includes the local participant video in the PiP mode for iOS
     */
    iOSPiPIncludeLocalParticipantVideo?: boolean;
    /**
     * If true, disables the Picture-in-Picture mode for iOS and Android
     */
    disablePictureInPicture?: boolean;
  };

export const CallContent = ({
  onHangupCallHandler,
  CallParticipantsList,
  CallControls = DefaultCallControls,
  FloatingParticipantView = DefaultFloatingParticipantView,
  ScreenShareOverlay = DefaultScreenShareOverlay,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  VideoRenderer,
  layout = 'grid',
  landscape = false,
  supportedReactions,
  iOSPiPIncludeLocalParticipantVideo,
  disablePictureInPicture,
}: CallContentProps) => {
  const [
    showRemoteParticipantInFloatingView,
    setShowRemoteParticipantInFloatingView,
  ] = useState<boolean>(false);
  const styles = useStyles();
  const {
    theme: { callContent },
  } = useTheme();
  const {
    useCallSettings,
    useHasOngoingScreenShare,
    useRemoteParticipants,
    useLocalParticipant,
  } = useCallStateHooks();

  useAutoEnterPiPEffect(disablePictureInPicture);

  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;

  const _remoteParticipants = useRemoteParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const localParticipant = useLocalParticipant();
  const isInPiPMode = useIsInPiPMode();
  const hasScreenShare = useHasOngoingScreenShare();
  const showSpotlightLayout = hasScreenShare || layout === 'spotlight';

  const showFloatingView =
    !showSpotlightLayout &&
    !isInPiPMode &&
    remoteParticipants.length > 0 &&
    remoteParticipants.length < 3;

  const isRemoteParticipantInFloatingView =
    showFloatingView &&
    showRemoteParticipantInFloatingView &&
    remoteParticipants.length === 1;

  /**
   * This hook is used to handle IncallManager specs of the application.
   */
  useEffect(() => {
    InCallManager.start({ media: isVideoEnabledInCall ? 'video' : 'audio' });

    return () => InCallManager.stop();
  }, [isVideoEnabledInCall]);

  const handleFloatingViewParticipantSwitch = () => {
    if (remoteParticipants.length !== 1) {
      return;
    }
    setShowRemoteParticipantInFloatingView((prevState) => !prevState);
  };

  const participantViewProps: ParticipantViewComponentProps = {
    ParticipantLabel: isInPiPMode ? null : ParticipantLabel,
    ParticipantNetworkQualityIndicator: isInPiPMode
      ? null
      : ParticipantNetworkQualityIndicator,
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
    supportedReactions,
  };

  const callParticipantsSpotlightProps: CallParticipantsSpotlightProps = {
    ...participantViewProps,
    landscape,
    ParticipantView,
    CallParticipantsList,
    ScreenShareOverlay,
    supportedReactions,
  };

  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <>
      {!disablePictureInPicture && (
        <RTCViewPipIOS
          includeLocalParticipantVideo={iOSPiPIncludeLocalParticipantVideo}
        />
      )}
      <View style={[styles.container, landscapeStyles, callContent.container]}>
        <View style={[styles.content, callContent.callParticipantsContainer]}>
          <View
            style={[styles.view, callContent.topContainer]}
            // "box-none" disallows the container view to be not take up touches
            // and allows only the top and floating view (its child views) to take up the touches
            pointerEvents="box-none"
          >
            {showFloatingView && FloatingParticipantView && (
              <FloatingParticipantView
                participant={
                  isRemoteParticipantInFloatingView
                    ? remoteParticipants[0]
                    : localParticipant
                }
                onPressHandler={handleFloatingViewParticipantSwitch}
                supportedReactions={supportedReactions}
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

        {!isInPiPMode && CallControls && (
          <CallControls
            onHangupCallHandler={onHangupCallHandler}
            landscape={landscape}
          />
        )}
      </View>
    </>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingBottom: theme.variants.insets.bottom,
          paddingLeft: theme.variants.insets.left,
          paddingRight: theme.variants.insets.right,
          paddingTop: theme.variants.insets.top,
          backgroundColor: theme.colors.sheetPrimary,
        },
        content: { flex: 1 },
        view: {
          ...StyleSheet.absoluteFillObject,
          zIndex: Z_INDEX.IN_FRONT,
        },
      }),
    [theme]
  );
};
