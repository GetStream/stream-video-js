import clsx from 'clsx';
import { MutableRefObject, RefObject, useEffect, useRef } from 'react';
import {
  Call,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useIsDebugMode } from '../Debug/useIsDebugMode';
import { DebugParticipantPublishQuality } from '../Debug/DebugParticipantPublishQuality';
import { DebugStatsView } from '../Debug/DebugStatsView';
import { Video, VideoProps } from './Video';
import { Notification } from '../Notification';

export interface ParticipantBoxProps {
  participant: StreamVideoParticipant;
  isMuted?: boolean;
  call: Call;
  sinkId?: string;
  indicatorsVisible?: boolean;
  setVideoElementRef?: (element: HTMLVideoElement | null) => void;
}

export const ParticipantBox = (props: ParticipantBoxProps) => {
  const {
    participant,
    isMuted = false,
    indicatorsVisible = true,
    call,
    sinkId,
    setVideoElementRef,
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    videoStream,
    audioStream,
    isLoggedInUser: isLocalParticipant,
    isDominantSpeaker,
    isSpeaking,
    publishedTracks,
    connectionQuality,
  } = participant;

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  useEffect(() => {
    const $el = audioRef.current;
    console.log(`Attaching audio stream`, $el, audioStream);
    if (!$el) return;
    if (audioStream) {
      $el.srcObject = audioStream;
      if (($el as any).setSinkId) {
        ($el as any).setSinkId(sinkId || '');
      }
    }
    return () => {
      $el.srcObject = null;
    };
  }, [audioStream, sinkId]);

  const connectionQualityAsString = String(
    SfuModels.ConnectionQuality[connectionQuality],
  ).toLowerCase();

  const isDebugMode = useIsDebugMode();
  return (
    <div
      className={clsx(
        'str-video__participant',
        isSpeaking && 'str-video__participant--speaking',
      )}
    >
      <audio autoPlay ref={audioRef} muted={isMuted} />
      <div className="str-video__video-container">
        <Video
          call={call}
          participant={participant}
          kind="video"
          setVideoElementRef={setVideoElementRef}
          className={clsx(
            'str-video__remote-video',
            isLocalParticipant && 'mirror',
          )}
          muted
          autoPlay
        />
        <div className="str-video__participant_details">
          <span className="str-video__participant_name">
            {participant.user?.name || participant.userId}
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
