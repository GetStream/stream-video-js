import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { useIsDebugMode } from '../Debug/useIsDebugMode';
import { DebugParticipantPublishQuality } from '../Debug/DebugParticipantPublishQuality';
import { DebugStatsView } from '../Debug/DebugStatsView';

export const ParticipantBox = (props: {
  participant: StreamVideoParticipant;
  isMuted?: boolean;
  updateVideoSubscriptionForParticipant: (
    sessionId: string,
    width: number,
    height: number,
  ) => void;
  call: Call;
  sinkId?: string;
}) => {
  const {
    participant,
    isMuted = false,
    updateVideoSubscriptionForParticipant,
    call,
    sinkId,
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    videoStream,
    audioStream,
    isLoggedInUser: isLocalParticipant,
    isSpeaking,
    sessionId,
    audio,
    video,
  } = participant;

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const width = containerRef.current!.clientWidth;
      const height = containerRef.current!.clientHeight;
      updateVideoSubscriptionForParticipant(sessionId, width, height);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [sessionId, updateVideoSubscriptionForParticipant]);

  useEffect(() => {
    const $el = videoRef.current;
    console.log(`Attaching video stream`, $el, videoStream);
    if (!$el) return;
    if (videoStream) {
      $el.srcObject = videoStream;
    }
    return () => {
      $el.srcObject = null;
    };
  }, [videoStream]);

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

  const isDebugMode = useIsDebugMode();
  return (
    <div
      className={clsx(
        'str-video__participant',
        isSpeaking && 'str-video__participant--speaking',
      )}
      ref={containerRef}
    >
      <audio autoPlay ref={audioRef} muted={isMuted} />
      <div className="str-video__video-container">
        <video
          className={clsx(
            'str-video__remote-video',
            isLocalParticipant && 'mirror',
          )}
          muted={isMuted}
          autoPlay
          ref={videoRef}
        />
        <div className="str-video__participant_details">
          <span className="str-video__participant_name">
            {participant.user?.id}
            {!audio && (
              <span className="str-video__participant_name--audio-muted"></span>
            )}
            {!video && (
              <span className="str-video__participant_name--video-muted"></span>
            )}
          </span>
          {isDebugMode && (
            <>
              <DebugParticipantPublishQuality
                updateVideoSubscriptionForParticipant={
                  updateVideoSubscriptionForParticipant
                }
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
