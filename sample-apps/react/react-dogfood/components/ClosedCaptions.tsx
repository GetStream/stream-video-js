import { useEffect, useState } from 'react';
import {
  CallClosedCaption,
  CompositeButton,
  Icon,
  OwnCapability,
  useCall,
  useCallStateHooks,
  WithTooltip,
} from '@stream-io/video-react-sdk';

export const ToggleClosedCaptionsButton = () => {
  const call = useCall();
  const { useIsCallCaptioningInProgress, useHasPermissions } =
    useCallStateHooks();
  const isCaptioned = useIsCallCaptioningInProgress();
  const canToggle = useHasPermissions(
    OwnCapability.START_CLOSED_CAPTIONS_CALL,
    OwnCapability.STOP_CLOSED_CAPTIONS_CALL,
  );
  return (
    <WithTooltip title="Toggle closed captions">
      <CompositeButton
        active={isCaptioned}
        disabled={!canToggle}
        variant="primary"
        onClick={async () => {
          if (!call) return;
          try {
            if (isCaptioned) {
              await call.stopClosedCaptions();
            } else {
              await call.startClosedCaptions();
            }
          } catch (e) {
            console.error('Failed to toggle closed captions', e);
          }
        }}
      >
        <Icon icon="closed-captions" />
      </CompositeButton>
    </WithTooltip>
  );
};

export const ClosedCaptions = () => {
  const { useCallClosedCaptions } = useCallStateHooks();
  const closedCaptions = useCallClosedCaptions();
  return (
    <div className="rd__closed-captions">
      <ClosedCaptionList queue={closedCaptions} />
    </div>
  );
};

export const ClosedCaptionsSidebar = () => {
  const call = useCall();
  const [queue, addToQueue] = useState<CallClosedCaption[]>([]);
  useEffect(() => {
    if (!call) return;
    return call.on('call.closed_caption', (e) => {
      addToQueue((q) => [...q, e.closed_caption]);
    });
  }, [call]);
  return (
    <div className="rd__closed-captions-sidebar">
      <h3>Closed Captions</h3>
      <div className="rd__closed-captions-sidebar__container">
        <ClosedCaptionList queue={queue} />
      </div>
    </div>
  );
};

const ClosedCaptionList = (props: { queue: CallClosedCaption[] }) => {
  const { queue } = props;
  return queue.map(({ user, text, start_time }) => (
    <p className="rd__closed-captions__line" key={`${user.id}-${start_time}`}>
      <span className="rd__closed-captions__speaker">{user.name}:</span>
      <span className="rd__closed-captions__text">{text}</span>
    </p>
  ));
};
