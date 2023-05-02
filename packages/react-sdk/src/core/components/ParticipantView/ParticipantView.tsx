import { PropsWithChildren, useState } from 'react';
import clsx from 'clsx';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

import { Audio } from '../Audio';
import { Video } from '../Video';
import { useTrackElementVisibility } from '../../hooks';

export type ParticipantViewProps = PropsWithChildren<{
  /**
   * The participant bound to this component.
   */
  participant: StreamVideoParticipant;

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
   * An additional list of class names to append to the root DOM element.
   */
  className?: string;
}>;

export const ParticipantView = ({
  participant,
  sinkId,
  videoKind = 'video',
  muteAudio,
  setVideoElementRef,
  className,
  children,
}: ParticipantViewProps) => {
  const {
    audioStream,
    isLoggedInUser,
    isSpeaking,
    publishedTracks,
    sessionId,
  } = participant;

  const call = useCall()!;

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const [trackedElement, setTrackedElement] = useState<HTMLDivElement | null>(
    null,
  );

  useTrackElementVisibility({
    sessionId,
    trackedElement,
    viewportTracker: call.viewportTracker,
  });

  return (
    <div
      className={clsx(
        'str-video__participant-view',
        isSpeaking && 'str-video__participant-view--speaking',
        !hasVideo && 'str-video__participant-view--no-video',
        !hasAudio && 'str-video__participant-view--no-audio',
        className,
      )}
      ref={setTrackedElement}
    >
      {children}
      <Audio
        // mute the local participant, as we don't want to hear ourselves
        muted={isLoggedInUser || muteAudio}
        sinkId={sinkId}
        audioStream={audioStream}
      />
      <Video
        call={call}
        participant={participant}
        kind={videoKind}
        setVideoElementRef={setVideoElementRef}
        autoPlay
      />
    </div>
  );
};
