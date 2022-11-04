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
  // TODO: add mute event handler to client
  const isVideoEnabled = true;
  return (
    <div
      className={clsx(
        'str-video__participant',
        isSpeaking && 'str-video__participant--speaking',
      )}
    >
      <audio autoPlay ref={audioRef} muted={isMuted} />
      <div className="str-video__video-container" ref={containerRef}>
        {isVideoEnabled ? (
          <video
            className={clsx(
              'str-video__remote-video',
              isLocalParticipant && 'mirror',
            )}
            muted={isMuted}
            autoPlay
            ref={videoRef}
          />
        ) : (
          <div>No video</div>
        )}
      </div>
      <div className="str-video__participant_details">
        <span className="str-video__participant_name">
          {participant.user?.id}
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
