import { useEffect, useState } from 'react';
import {
  CompositeButton,
  Icon,
  StreamCallClosedCaption,
  useCall,
  useCallStateHooks,
  WithTooltip,
} from '@stream-io/video-react-sdk';

export const ToggleClosedCaptionsButton = () => {
  const call = useCall();
  const { useIsCallCaptioningInProgress } = useCallStateHooks();
  const isCaptioned = useIsCallCaptioningInProgress();
  return (
    <WithTooltip title="Toggle closed captions">
      <CompositeButton
        active={isCaptioned}
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
  const [queue, addToQueue] = useState<StreamCallClosedCaption[]>([]);
  useEffect(() => {
    if (!call) return;
    return call.on('call.closed_caption', (e) => {
      const { closed_caption: cc } = e;
      const participant = call.state.sessionParticipantsByUserId[cc.speaker_id];
      const speaker_name = participant?.user.name || cc.speaker_id;
      addToQueue((q) => [...q, { ...cc, speaker_name }]);
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

const ClosedCaptionList = (props: { queue: StreamCallClosedCaption[] }) => {
  const { queue } = props;
  return (
    <>
      {queue.map(({ speaker_name, text, start_time }) => (
        <p
          className="rd__closed-captions__line"
          key={`${speaker_name}-${start_time}`}
        >
          <span className="rd__closed-captions__speaker">{speaker_name}:</span>
          <span className="rd__closed-captions__text">{text}</span>
        </p>
      ))}
    </>
  );
};
