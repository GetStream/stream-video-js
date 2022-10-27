import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { useIsDebugMode } from '../../hooks/useIsDebugMode';
import { Call } from '@stream-io/video-client';
import { Participant } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { SfuEvent } from '@stream-io/video-client/dist/src/gen/video/sfu/event/events';
import { UserSubscriptions } from './Stage';
import { useRtcStats } from '../../hooks/useRtcStats';
import { usePopper } from 'react-popper';

export const ParticipantBox = (props: {
  participant: Participant;
  isLocalParticipant: boolean;
  isMuted?: boolean;
  audioStream?: MediaStream;
  videoStream?: MediaStream;
  updateVideoElementForUserId: (
    userId: string,
    element: HTMLVideoElement | null,
  ) => void;
  call: Call;
  updateSubscriptionsPartial?: (
    partialSubscriptions: UserSubscriptions,
  ) => Promise<void>;
}) => {
  const {
    audioStream,
    videoStream,
    participant,
    isLocalParticipant,
    isMuted = false,
    updateVideoElementForUserId,
    call,
    updateSubscriptionsPartial,
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const userId = participant.user!.id;
    updateVideoElementForUserId(userId, videoRef.current);
    return () => {
      updateVideoElementForUserId(userId, null);
    };
  }, [participant.user, updateVideoElementForUserId]);

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
    <div className="str-video__participant">
      <audio autoPlay ref={audioRef} muted={isMuted} />
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
        </span>
        {isDebugMode && (
          <>
            <DebugParticipantPublishQuality
              updateSubscriptionsPartial={updateSubscriptionsPartial}
              userId={participant.user!.id}
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
  userId: string;
  call: Call;
  updateSubscriptionsPartial?: (
    partialSubscriptions: UserSubscriptions,
  ) => Promise<void>;
}) => {
  const { call, userId, updateSubscriptionsPartial } = props;
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
        if (updateSubscriptionsPartial) {
          let w = 1280;
          let h = 720;
          if (value === 'h') {
            w = 640;
            h = 480;
          } else if (value === 'q') {
            w = 320;
            h = 240;
          }
          updateSubscriptionsPartial({
            [userId]: {
              width: w,
              height: h,
            },
          }).catch((e) => {
            console.warn(`Failed to update partial user subscriptions`, e);
          });
        }
      }}
    >
      <option value="f">High (f)</option>
      <option value="h">Medium (h)</option>
      <option value="q">Low (q)</option>
    </select>
  );
};
