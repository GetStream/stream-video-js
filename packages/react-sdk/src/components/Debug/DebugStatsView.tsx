import { useState } from 'react';
import { Call } from '@stream-io/video-client';
import { useRtcStats } from '../../hooks/useRtcStats';
import { useFloatingUIPreset } from '../../hooks';

export const DebugStatsView = (props: {
  call: Call;
  kind: 'subscriber' | 'publisher';
  mediaStream?: MediaStream;
}) => {
  const { call, kind, mediaStream } = props;
  const stats = useRtcStats(call, kind, mediaStream);

  const { refs, strategy, y, x } = useFloatingUIPreset({
    placement: 'top',
    strategy: 'absolute',
  });

  const [isPopperOpen, setIsPopperOpen] = useState(false);

  const [videoTrack] = mediaStream?.getVideoTracks() ?? [];
  const settings = videoTrack?.getSettings();
  return (
    <>
      <span
        className="str-video__debug__track-stats-icon"
        tabIndex={0}
        ref={refs.setReference}
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
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            overflowY: 'auto',
          }}
        >
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
    </>
  );
};
