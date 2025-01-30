import { CallClosedCaption } from '@stream-io/video-react-sdk';
import './AiCaptions.css';

export function AiCaptions(props: { captions: CallClosedCaption[] }) {
  return (
    <div className="ai-captions">
      {props.captions.slice(0, 6).map((caption) => (
        <div key={caption.start_time} className="ai-captions__caption">
          {caption.text}
        </div>
      ))}
    </div>
  );
}
