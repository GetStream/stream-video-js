import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useIsDebugMode } from '../../hooks/useIsDebugMode';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { SfuEvent } from '@stream-io/video-client/dist/src/gen/video/sfu/event/events';
import { useRtcStats } from '../../hooks/useRtcStats';
import { usePopper } from 'react-popper';

export const ParticipantBox = (props: {
  participant: StreamVideoParticipant;
  isMuted?: boolean;
  updateVideoSubscriptionForParticipant: (
    sessionId: string,
    width: number,
    height: number,
  ) => void;
  call: Call;
}) => {
  const {
    participant,
    isMuted = false,
    updateVideoSubscriptionForParticipant,
    call,
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    videoTrack: videoStream,
    audioTrack: audioStream,
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
    }
    return () => {
      $el.srcObject = null;
    };
  }, [audioStream]);

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
              <svg viewBox="0 0 24 24">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"></path>
              </svg>
            )}
            {!video && (
              <svg viewBox="0 0 24 24">
                <path d="m21 6.5-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2 2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"></path>
              </svg>
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
              <StatsView
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

const StatsView = (props: {
  call: Call;
  kind: 'subscriber' | 'publisher';
  mediaStream?: MediaStream;
}) => {
  const { call, kind, mediaStream } = props;
  const stats = useRtcStats(call, kind, mediaStream);

  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(anchor, popover);
  const [isPopperOpen, setIsPopperOpen] = useState(false);

  const [videoTrack] = mediaStream?.getVideoTracks() ?? [];
  const settings = videoTrack?.getSettings();
  return (
    <>
      <span
        className="str-video__debug__track-stats-icon"
        tabIndex={0}
        ref={setAnchor}
        title={
          settings &&
          `${settings.width}x${settings.height}@${Math.round(
            settings.frameRate || 0,
          )}`
        }
        onClick={() => {
          setIsPopperOpen((v) => !v);
        }}
      />
      {isPopperOpen && (
        <div
          className="str-video__debug__track-stats"
          ref={setPopover}
          style={styles.popper}
          {...attributes.popper}
        >
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
    </>
  );
};

const DebugParticipantPublishQuality = (props: {
  participant: StreamVideoParticipant;
  call: Call;
  updateVideoSubscriptionForParticipant: (
    sessionId: string,
    width: number,
    height: number,
  ) => void;
}) => {
  const { call, participant, updateVideoSubscriptionForParticipant } = props;
  const [quality, setQuality] = useState<string>();
  const [publishStats, setPublishStats] = useState(() => ({
    f: true,
    h: true,
    q: true,
  }));

  useEffect(() => {
    return call.on('changePublishQuality', (event: SfuEvent) => {
      if (event.eventPayload.oneofKind !== 'changePublishQuality') return;
      const { videoSenders } = event.eventPayload.changePublishQuality;
      // FIXME OL: support additional layers (like screenshare)
      const [videoLayer] = videoSenders.map(({ layers }) => {
        return layers.map((l) => ({ [l.name]: l.active }));
      });
      // @ts-ignore
      setPublishStats((s) => ({
        ...s,
        ...videoLayer,
      }));
    });
  }, [call]);

  return (
    <select
      title={`Published tracks: ${JSON.stringify(publishStats)}`}
      value={quality}
      onChange={(e) => {
        const value = e.target.value;
        setQuality(value);
        let w = 1280;
        let h = 720;
        if (value === 'h') {
          w = 640;
          h = 480;
        } else if (value === 'q') {
          w = 320;
          h = 240;
        }
        updateVideoSubscriptionForParticipant(participant.sessionId, w, h);
      }}
    >
      <option value="f">High (f)</option>
      <option value="h">Medium (h)</option>
      <option value="q">Low (q)</option>
    </select>
  );
};
