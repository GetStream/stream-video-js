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

export interface ParticipantBoxProps {
  participant: StreamVideoParticipant;
  isMuted?: boolean;
  call: Call;
  sinkId?: string;
  indicatorsVisible?: boolean;
  setVideoElementRef?: (element: HTMLElement | null) => void;
  className?: string;
}

export const ParticipantBox = (props: ParticipantBoxProps) => {
  const {
    participant,
    isMuted = false,
    indicatorsVisible = true,
    call,
    sinkId,
    setVideoElementRef,
    className,
  } = props;

  const {
    videoStream,
    isLoggedInUser: isLocalParticipant,
    isDominantSpeaker,
    isSpeaking,
    publishedTracks,
    connectionQuality,
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
        className,
      )}
    >
      <Audio
        muted={isMuted}
        sinkId={sinkId}
        audioStream={participant.audioStream}
      />
      <div className="str-video__video-container">
        <Video
          call={call}
          participant={participant}
          kind="video"
          setVideoElementRef={setVideoElementRef}
          className={clsx('str-video__remote-video', {
            'str-video__remote-video--mirror': isLocalParticipant,
          })}
          muted={isMuted}
          autoPlay
        />
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
