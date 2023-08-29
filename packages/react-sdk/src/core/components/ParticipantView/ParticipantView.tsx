import {
  ComponentType,
  createContext,
  forwardRef,
  ReactElement,
  useContext,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import {
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  VideoTrackType,
} from '@stream-io/video-client';

import { Audio } from '../Audio';
import { Video, VideoProps } from '../Video';
import { useTrackElementVisibility } from '../../hooks';
import { DefaultParticipantViewUI } from './DefaultParticipantViewUI';
import { applyElementToRef, isComponentType } from '../../../utilities';

export type ParticipantViewContextValue = Required<
  Pick<ParticipantViewProps, 'participant' | 'trackType'>
> & {
  participantViewElement: HTMLDivElement | null;
  videoElement: HTMLVideoElement | null;
  videoPlaceholderElement: HTMLDivElement | null;
};

const ParticipantViewContext = createContext<
  ParticipantViewContextValue | undefined
>(undefined);

export const useParticipantViewContext = () =>
  useContext(ParticipantViewContext) as ParticipantViewContextValue;

export type ParticipantViewProps = {
  /**
   * The participant whose video/audio stream we want to play.
   */
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;

  /**
   * Override the default UI for rendering participant information/actions.
   * pass `null` if you wish to not render anything
   * @default DefaultParticipantViewUI
   */
  ParticipantViewUI?: ComponentType | ReactElement | null;

  /**
   * The kind of video stream to play for the given participant. The default value is `video`. You can use `none` if you're building an audio-only call.
   */
  trackType?: VideoTrackType | 'none';

  /**
   * This prop is only useful for advanced use-cases (for example building your own paginated layout). When set to `true` it will mute the give participant's audio stream on the client side. The local participant is always muted.
   */
  muteAudio?: boolean;

  /**
   * An object with set functions meant for exposing the video
   * and video placeholder elements to the integrators. It's useful when you want to attach custom event handlers to these elements.
   * - `refs.setVideoElement`
   * - `refs.setVideoPlaceholderElement`
   */
  refs?: VideoProps['refs'];

  /**
   * Custom class applied to the root DOM element.
   */
  className?: string;
} & Pick<VideoProps, 'VideoPlaceholder'>;

export const ParticipantView = forwardRef<HTMLDivElement, ParticipantViewProps>(
  (
    {
      participant,
      trackType = 'videoTrack',
      muteAudio,
      refs: { setVideoElement, setVideoPlaceholderElement } = {},
      className,
      VideoPlaceholder,
      ParticipantViewUI = DefaultParticipantViewUI as ComponentType,
    },
    ref,
  ) => {
    const {
      isLocalParticipant,
      isSpeaking,
      isDominantSpeaker,
      publishedTracks,
      sessionId,
    } = participant;

    const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
    const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

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
        ref={(element) => {
          applyElementToRef(ref, element);
          setTrackedElement(element);
        }}
        className={clsx(
          'str-video__participant-view',
          isDominantSpeaker && 'str-video__participant-view--dominant-speaker',
          isSpeaking && 'str-video__participant-view--speaking',
          !hasVideo && 'str-video__participant-view--no-video',
          !hasAudio && 'str-video__participant-view--no-audio',
          className,
        )}
      >
        <ParticipantViewContext.Provider value={participantViewContextValue}>
          {/* mute the local participant, as we don't want to hear ourselves */}
          {!isLocalParticipant && !muteAudio && (
            <Audio participant={participant} />
          )}
          <Video
            VideoPlaceholder={VideoPlaceholder}
            participant={participant}
            trackType={trackType}
            refs={videoRefs}
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
