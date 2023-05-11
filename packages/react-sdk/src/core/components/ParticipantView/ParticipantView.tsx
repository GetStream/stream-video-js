import { forwardRef, ComponentType, useState, ReactElement } from 'react';
import clsx from 'clsx';
import {
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';

import { Audio } from '../Audio';
import { applyElementRef, Video, VideoProps } from '../Video';
import { useTrackElementVisibility } from '../../hooks';
import { ParticipantViewUIProps } from './DefaultParticipantViewUI';
import { isComponentType } from '../../../utilities';

export type ParticipantViewProps = {
  /**
   * The participant bound to this component.
   */
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;

  /**
   * Component used to render user interface elements (details, network status...)
   */
  ParticipantViewUI?: ComponentType<ParticipantViewUIProps> | ReactElement;

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
   * A function meant for exposing the "native" element ref to the integrators.
   * The element can either be:
   * - `<video />` for participants with enabled video.
   * - `<div />` for participants with disabled video. This ref would point to
   * the VideoPlaceholder component.
   *
   * @param element the element ref.
   */
  setVideoElementRef?: (element: HTMLElement | null) => void;

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
      setVideoElementRef,
      className,
      VideoPlaceholder,
      ParticipantViewUI,
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

    useTrackElementVisibility({
      sessionId,
      trackedElement,
    });

    return (
      <div
        ref={(element) => {
          applyElementRef(ref, element);
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
        {isComponentType(ParticipantViewUI) ? (
          <ParticipantViewUI participant={participant} />
        ) : (
          ParticipantViewUI
        )}
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
          setVideoElementRef={setVideoElementRef}
          autoPlay
        />
      </div>
    );
  },
);
