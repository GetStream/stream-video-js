import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, Platform, StyleSheet, View } from 'react-native';
import {
  CallParticipantsGrid,
  type CallParticipantsGridProps,
  CallParticipantsSpotlight,
  type CallParticipantsSpotlightProps,
} from '../CallLayout';
import {
  type CallControlProps,
  CallControls as DefaultCallControls,
  type HangUpCallButtonProps,
} from '../CallControls';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  CallingState,
  type StreamReaction,
  type StreamVideoParticipant,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { debounceTime } from 'rxjs';

import { Z_INDEX } from '../../../constants';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  type FloatingParticipantViewProps,
  type ParticipantViewComponentProps,
} from '../../Participant';
import { useTheme } from '../../../contexts';
import {
  type CallParticipantsListComponentProps,
  type CallParticipantsListProps,
} from '../CallParticipantsList';
import { useAutoEnterPiPEffect, useIsInPiPMode } from '../../../hooks';
import {
  ScreenShareOverlay as DefaultScreenShareOverlay,
  type ScreenShareOverlayProps,
} from '../../utility/ScreenShareOverlay';
import { RTCViewPipIOS } from './RTCViewPipIOS';
import { getRNInCallManagerLibNoThrow } from '../../../modules/call-manager/PrevLibDetection';

export type StreamReactionType = StreamReaction & {
  icon: string;
};

type CallContentComponentProps = ParticipantViewComponentProps &
  Pick<CallParticipantsListComponentProps, 'ParticipantView' | 'mirror'> & {
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
    /**
     * @deprecated This prop is deprecated and will be removed in the future. Use `StreamInCallManager` instead.
     * Props to set the audio mode for the react-native-incall-manager library
     * If media type is video, audio is routed by default to speaker, otherwise it is routed to earpiece.
     * Changing the mode on the fly is not supported.
     * Manually invoke `InCallManager.start({ media })` to achieve this.
     * @default 'video'
     */
    initialInCallManagerAudioMode?: 'video' | 'audio';
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
  mirror,
  layout = 'grid',
  landscape = false,
  supportedReactions,
  initialInCallManagerAudioMode = 'video',
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
  const call = useCall();
  const { useHasOngoingScreenShare, useLocalParticipant } = useCallStateHooks();

  useAutoEnterPiPEffect(disablePictureInPicture);

  // CallContent only needs to know whether to show the floating view (0 / 1-2 / 3+
  // remote participants) and the single participant to render in it. Storing a count
  // bucket plus that one participant - instead of the whole array - means CallContent
  // re-renders only on bucket-boundary crossings, not on every debounced emission.
  const [floatingViewState, setFloatingViewState] = useState<{
    remoteCountBucket: number;
    firstRemoteParticipant: StreamVideoParticipant | undefined;
  }>(() => {
    const remote = call?.state.remoteParticipants ?? [];
    return {
      remoteCountBucket: Math.min(remote.length, 3),
      firstRemoteParticipant: remote.length === 1 ? remote[0] : undefined,
    };
  });
  useEffect(() => {
    if (!call) {
      setFloatingViewState({
        remoteCountBucket: 0,
        firstRemoteParticipant: undefined,
      });
      return;
    }
    const sub = call.state.remoteParticipants$
      .pipe(debounceTime(300))
      .subscribe((remoteParticipants) => {
        const remoteCountBucket = Math.min(remoteParticipants.length, 3);
        const firstRemoteParticipant =
          remoteParticipants.length === 1 ? remoteParticipants[0] : undefined;
        setFloatingViewState((prev) => {
          if (
            prev.remoteCountBucket === remoteCountBucket &&
            prev.firstRemoteParticipant === firstRemoteParticipant
          ) {
            return prev;
          }
          return { remoteCountBucket, firstRemoteParticipant };
        });
      });
    return () => sub.unsubscribe();
  }, [call]);
  const localParticipant = useLocalParticipant();
  const isInPiPMode = useIsInPiPMode();
  const hasScreenShare = useHasOngoingScreenShare();
  const showSpotlightLayout = hasScreenShare || layout === 'spotlight';

  useEffect(() => {
    if (!isInPiPMode || Platform.OS !== 'android') return;
    const unsubFunc = call?.on('call.ended', () => {
      videoLoggerSystem
        .getLogger('CallContent')
        .debug(`exiting PiP mode due to call.ended`);
      NativeModules.StreamVideoReactNative.exitPipMode();
    });
    const subscription = call?.state.callingState$.subscribe((state) => {
      if (state === CallingState.LEFT) {
        videoLoggerSystem
          .getLogger('CallContent')
          .debug(`exiting PiP mode due to callingState: LEFT`);
        NativeModules.StreamVideoReactNative.exitPipMode();
      }
    });
    return () => {
      unsubFunc?.();
      subscription?.unsubscribe();
    };
  }, [isInPiPMode, call]);

  const { remoteCountBucket, firstRemoteParticipant } = floatingViewState;

  const showFloatingView =
    !showSpotlightLayout &&
    !isInPiPMode &&
    remoteCountBucket > 0 &&
    remoteCountBucket < 3;

  const isRemoteParticipantInFloatingView =
    showFloatingView &&
    showRemoteParticipantInFloatingView &&
    remoteCountBucket === 1;

  /**
   * This hook is used to handle IncallManager specs of the application.
   */
  const incallManagerModeRef = useRef(initialInCallManagerAudioMode);
  useEffect(() => {
    const prevInCallManager = getRNInCallManagerLibNoThrow();
    if (prevInCallManager) {
      prevInCallManager.start({ media: incallManagerModeRef.current });
      return () => {
        prevInCallManager.stop();
      };
    }
    return undefined;
  }, []);

  const handleFloatingViewParticipantSwitch = () => {
    if (remoteCountBucket !== 1) {
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
    mirror,
    CallParticipantsList,
    supportedReactions,
  };

  const callParticipantsSpotlightProps: CallParticipantsSpotlightProps = {
    ...participantViewProps,
    landscape,
    ParticipantView,
    mirror,
    CallParticipantsList,
    ScreenShareOverlay,
    supportedReactions,
  };

  return (
    <>
      {!disablePictureInPicture && (
        <RTCViewPipIOS
          includeLocalParticipantVideo={iOSPiPIncludeLocalParticipantVideo}
          mirror={mirror}
        />
      )}
      <View
        style={[
          styles.container,
          landscape ? landscapeStyles.row : landscapeStyles.column,
          callContent.container,
        ]}
      >
        <View style={[styles.content, callContent.callParticipantsContainer]}>
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.view,
              callContent.topContainer,
            ]}
            // "box-none" disallows the container view to be not take up touches
            // and allows only the top and floating view (its child views) to take up the touches
            pointerEvents="box-none"
          >
            {showFloatingView && FloatingParticipantView && (
              <FloatingParticipantView
                participant={
                  isRemoteParticipantInFloatingView
                    ? firstRemoteParticipant
                    : localParticipant
                }
                onPressHandler={handleFloatingViewParticipantSwitch}
                supportedReactions={supportedReactions}
                objectFit="cover"
                mirror={mirror}
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

const landscapeStyles = StyleSheet.create({
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
});

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
          zIndex: Z_INDEX.IN_FRONT,
        },
      }),
    [theme],
  );
};
