import clsx from 'clsx';
import {
  Call,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useIsDebugMode } from '../Debug/useIsDebugMode';
import { DebugParticipantPublishQuality } from '../Debug/DebugParticipantPublishQuality';
import { DebugStatsView } from '../Debug/DebugStatsView';
import { Audio } from './Audio';
import { Video } from '../Video';
import { Notification } from '../Notification';
import { Reaction } from '../Reaction';

export interface ParticipantBoxProps {
  /**
   * The participant bound to this component.
   */
  participant: StreamVideoParticipant;

  /**
   * The current call.
   */
  call: Call;

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
   * Turns on/off the status indicator icons (mute, connection quality, etc...).
   */
  indicatorsVisible?: boolean;

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
}

export const ParticipantBox = (props: ParticipantBoxProps) => {
  const {
    participant,
    indicatorsVisible = true,
    videoKind = 'video',
    call,
    sinkId,
    setVideoElementRef,
    className,
  } = props;

  const {
    audioStream,
    videoStream,
    isLoggedInUser: isLocalParticipant,
    isDominantSpeaker,
    isSpeaking,
    publishedTracks,
    connectionQuality,
    sessionId,
    reaction,
  } = participant;

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const connectionQualityAsString = String(
    SfuModels.ConnectionQuality[connectionQuality],
  ).toLowerCase();

  const isDebugMode = useIsDebugMode();
  return (
    <div
      className={clsx(
        'str-video__participant',
        isSpeaking && 'str-video__participant--speaking',
        !hasVideo && 'str-video__participant--no-video',
        !hasAudio && 'str-video__participant--no-audio',
        className,
      )}
    >
      <div className="str-video__video-container">
        <Audio
          // mute the local participant, as we don't want to hear ourselves
          muted={participant.isLoggedInUser}
          sinkId={sinkId}
          audioStream={audioStream}
        />
        <Video
          call={call}
          participant={participant}
          kind={videoKind}
          setVideoElementRef={setVideoElementRef}
          className={clsx('str-video__remote-video', {
            'str-video__remote-video--mirror':
              isLocalParticipant && videoKind === 'video',
            'str-video__screen-share': videoKind === 'screen',
          })}
          // mute the local participant, as we don't want to hear ourselves
          muted={participant.isLoggedInUser}
          autoPlay
        />
        {reaction && (
          <Reaction reaction={reaction} sessionId={sessionId} call={call} />
        )}
        <div className="str-video__participant_details">
          <span className="str-video__participant_name">
            {participant.name || participant.userId}
            {indicatorsVisible && isDominantSpeaker && (
              <span
                className="str-video__participant_name--dominant_speaker"
                title="Dominant speaker"
              />
            )}
            {indicatorsVisible && (
              <Notification
                isVisible={
                  isLocalParticipant &&
                  connectionQuality === SfuModels.ConnectionQuality.POOR
                }
                message="Poor connection quality. Please check your internet connection."
              >
                <span
                  className={clsx(
                    'str-video__participant__connection-quality',
                    `str-video__participant__connection-quality--${connectionQualityAsString}`,
                  )}
                  title={connectionQualityAsString}
                />
              </Notification>
            )}
            {indicatorsVisible && !hasAudio && (
              <span className="str-video__participant_name--audio-muted"></span>
            )}
            {indicatorsVisible && !hasVideo && (
              <span className="str-video__participant_name--video-muted"></span>
            )}
          </span>
          {isDebugMode && (
            <>
              <DebugParticipantPublishQuality
                participant={participant}
                call={call}
              />
              <DebugStatsView
                call={call}
                kind={isLocalParticipant ? 'publisher' : 'subscriber'}
                mediaStream={videoStream}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
