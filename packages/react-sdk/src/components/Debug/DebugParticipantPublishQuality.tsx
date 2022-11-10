import { useEffect, useState } from 'react';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';

export const DebugParticipantPublishQuality = (props: {
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
    return call.on('changePublishQuality', (event) => {
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
