import { useContext, useMemo } from 'react';
import {
  forwardRef,
  ComponentType,
  useState,
  ReactElement,
  createContext,
} from 'react';
import clsx from 'clsx';
import {
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';

import { Audio } from '../Audio';
import { Video, VideoProps } from '../Video';
import { useTrackElementVisibility } from '../../hooks';
import { DefaultParticipantViewUI } from './DefaultParticipantViewUI';
import { isComponentType, applyElementToRef } from '../../../utilities';

export type ParticipantViewContextValue = Pick<
  ParticipantViewProps,
  'participant'
> & {
  participantViewElement: HTMLDivElement | null;
};

const ParticipantViewContext = createContext<
  ParticipantViewContextValue | undefined
>(undefined);

export const useParticipantViewContext = () =>
  useContext(ParticipantViewContext) as ParticipantViewContextValue;

export type ParticipantViewProps = {
  /**
   * The participant bound to this component.
   */
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;

  /**
   * Component used to render user interface elements (details, network status...),
   * pass `null` if you wish to not render anything
   * @default DefaultParticipantViewUI
   */
  ParticipantViewUI?: ComponentType | ReactElement | null;

  /**
   * In supported browsers, this sets the default audio output.
   * The value of this prop should be a valid Audio Output `deviceId`.
   */
  sinkId?: string;

  /**
   * The kind of video stream to play for the given participant.
   */
  videoKind?: 'video' | 'screen';

  /**
   * Turns on/off the audio for the participant.
   */
  muteAudio?: boolean;

  /**
   * An object with set functions meant for exposing the "native" video
   * and video placeholder elements to the integrators.
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
      sinkId,
      videoKind = 'video',
      muteAudio,
      refs,
      className,
      VideoPlaceholder,
      ParticipantViewUI = DefaultParticipantViewUI as ComponentType,
    },
    ref,
  ) => {
    const {
      audioStream,
      isLoggedInUser,
      isSpeaking,
      publishedTracks,
      sessionId,
    } = participant;

    const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
    const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

    const [trackedElement, setTrackedElement] = useState<HTMLDivElement | null>(
      null,
    );

    // TODO: allow to pass custom ViewportTracker instance from props
    useTrackElementVisibility({
      sessionId,
      trackedElement,
    });

    const participantViewContextValue = useMemo(
      () => ({ participant, participantViewElement: trackedElement }),
      [participant, trackedElement],
    );

    return (
      <div
        ref={(element) => {
          applyElementToRef(ref, element);
          setTrackedElement(element);
        }}
        className={clsx(
          'str-video__participant-view',
          isSpeaking && 'str-video__participant-view--speaking',
          !hasVideo && 'str-video__participant-view--no-video',
          !hasAudio && 'str-video__participant-view--no-audio',
          className,
        )}
      >
        <ParticipantViewContext.Provider value={participantViewContextValue}>
          <Audio
            // mute the local participant, as we don't want to hear ourselves
            muted={isLoggedInUser || muteAudio}
            sinkId={sinkId}
            audioStream={audioStream}
          />
          <Video
            VideoPlaceholder={VideoPlaceholder}
            participant={participant}
            kind={videoKind}
            refs={refs}
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
