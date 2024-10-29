import {
  ComponentType,
  forwardRef,
  ReactElement,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import {
  hasAudio,
  hasScreenShareAudio,
  hasVideo,
  StreamVideoParticipant,
  VideoTrackType,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

import { Audio } from '../Audio';
import { Video, VideoProps } from '../Video';
import { useTrackElementVisibility } from '../../hooks';
import { DefaultParticipantViewUI } from './DefaultParticipantViewUI';
import { applyElementToRef, isComponentType } from '../../../utilities';
import { ParticipantViewContext } from './ParticipantViewContext';

export type ParticipantViewProps = {
  /**
   * The participant whose video/audio stream we want to play.
   */
  participant: StreamVideoParticipant;

  /**
   * Override the default UI for rendering participant information/actions.
   * pass `null` if you wish to not render anything
   * @default DefaultParticipantViewUI
   */
  ParticipantViewUI?: ComponentType | ReactElement | null;

  /**
   * The kind of video stream to play for the given participant.
   * The default value is `videoTrack`.
   * You can use `none` if you're building an audio-only call.
   */
  trackType?: VideoTrackType | 'none';

  /**
   * Forces participant's video to be mirrored or unmirrored. By default, video track
   * from the local participant is mirrored, and all other videos are not mirrored.
   */
  mirror?: boolean;

  /**
   * This prop is only useful for advanced use-cases (for example, building your own layout).
   * When set to `true` it will mute the give participant's audio stream on the client side.
   * The local participant is always muted.
   */
  muteAudio?: boolean;

  /**
   * An object with set functions meant for exposing the video
   * and video placeholder elements to the integrators.
   * It's useful when you want to attach custom event handlers to these elements.
   * - `refs.setVideoElement`
   * - `refs.setVideoPlaceholderElement`
   */
  refs?: VideoProps['refs'];

  /**
   * Custom class applied to the root DOM element.
   */
  className?: string;
} & Pick<VideoProps, 'VideoPlaceholder' | 'PictureInPicturePlaceholder'>;

export const ParticipantView = forwardRef<HTMLDivElement, ParticipantViewProps>(
  function ParticipantView(
    {
      participant,
      trackType = 'videoTrack',
      mirror,
      muteAudio,
      refs: { setVideoElement, setVideoPlaceholderElement } = {},
      className,
      VideoPlaceholder,
      PictureInPicturePlaceholder,
      ParticipantViewUI = DefaultParticipantViewUI as ComponentType,
    },
    ref,
  ) {
    const { isLocalParticipant, isSpeaking, isDominantSpeaker, sessionId } =
      participant;

    const hasAudioTrack = hasAudio(participant);
    const hasVideoTrack = hasVideo(participant);
    const hasScreenShareAudioTrack = hasScreenShareAudio(participant);

    const [trackedElement, setTrackedElement] = useState<HTMLDivElement | null>(
      null,
    );

    const [contextVideoElement, setContextVideoElement] =
      useState<HTMLVideoElement | null>(null);

    const [contextVideoPlaceholderElement, setContextVideoPlaceholderElement] =
      useState<HTMLDivElement | null>(null);

    // TODO: allow to pass custom ViewportTracker instance from props
    useTrackElementVisibility({
      sessionId,
      trackedElement,
      trackType,
    });

    const { useIncomingVideoSettings } = useCallStateHooks();
    const { isParticipantVideoEnabled } = useIncomingVideoSettings();

    const participantViewContextValue = useMemo(
      () => ({
        participant,
        participantViewElement: trackedElement,
        videoElement: contextVideoElement,
        videoPlaceholderElement: contextVideoPlaceholderElement,
        trackType,
      }),
      [
        contextVideoElement,
        contextVideoPlaceholderElement,
        participant,
        trackedElement,
        trackType,
      ],
    );

    const videoRefs: VideoProps['refs'] = useMemo(
      () => ({
        setVideoElement: (element) => {
          setVideoElement?.(element);
          setContextVideoElement(element);
        },
        setVideoPlaceholderElement: (element) => {
          setVideoPlaceholderElement?.(element);
          setContextVideoPlaceholderElement(element);
        },
      }),
      [setVideoElement, setVideoPlaceholderElement],
    );

    return (
      <div
        data-testid="participant-view"
        ref={(element) => {
          applyElementToRef(ref, element);
          setTrackedElement(element);
        }}
        className={clsx(
          'str-video__participant-view',
          isDominantSpeaker && 'str-video__participant-view--dominant-speaker',
          isSpeaking && 'str-video__participant-view--speaking',
          !hasVideoTrack && 'str-video__participant-view--no-video',
          !hasAudioTrack && 'str-video__participant-view--no-audio',
          className,
        )}
      >
        <ParticipantViewContext.Provider value={participantViewContextValue}>
          {/* mute the local participant, as we don't want to hear ourselves */}
          {!isLocalParticipant && !muteAudio && (
            <>
              {hasAudioTrack && (
                <Audio participant={participant} trackType="audioTrack" />
              )}
              {hasScreenShareAudioTrack && (
                <Audio
                  participant={participant}
                  trackType="screenShareAudioTrack"
                />
              )}
            </>
          )}
          <Video
            VideoPlaceholder={VideoPlaceholder}
            PictureInPicturePlaceholder={PictureInPicturePlaceholder}
            participant={participant}
            trackType={trackType}
            refs={videoRefs}
            enabled={
              isLocalParticipant ||
              trackType !== 'videoTrack' ||
              isParticipantVideoEnabled(participant.sessionId)
            }
            mirror={mirror}
            autoPlay
          />
          {isComponentType(ParticipantViewUI) ? (
            <ParticipantViewUI />
          ) : (
            ParticipantViewUI
          )}
        </ParticipantViewContext.Provider>
      </div>
    );
  },
);

ParticipantView.displayName = 'ParticipantView';
