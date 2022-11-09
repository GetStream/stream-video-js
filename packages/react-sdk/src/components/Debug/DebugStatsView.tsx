import { useState } from 'react';
import { usePopper } from 'react-popper';
import { Call } from '@stream-io/video-client';
import { useRtcStats } from '../../hooks/useRtcStats';

export const DebugStatsView = (props: {
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
