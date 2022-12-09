import { useEffect, useState } from 'react';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';

export const DebugParticipantPublishQuality = (props: {
  participant: StreamVideoParticipant;
  call: Call;
}) => {
  const { call, participant } = props;
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
        let w = 960;
        let h = 540;
        if (value === 'h') {
          w = w / 2; // 480
          h = h / 2; // 270
        } else if (value === 'q') {
          w = w / 4; // 240
          h = h / 4; // 135
        }
        call.updateSubscriptionsPartial('video', {
          [participant.sessionId]: {
            dimension: {
              width: w,
              height: h,
            },
          },
        });
      }}
    >
      <option value="f">High (f)</option>
      <option value="h">Medium (h)</option>
      <option value="q">Low (q)</option>
    </select>
  );
};
