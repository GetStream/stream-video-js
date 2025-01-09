import { CallRecordings } from '../CallRecordings';
import { Icon } from '@stream-io/video-react-sdk';

export function Recordings({
  className,
  onClose,
}: {
  className?: string;
  onClose: () => void;
}) {
  return (
    <div className="rd__summary-recordings">
      <div className="rd__summary-recordings-close" onClick={onClose}>
        <Icon icon="close" />
      </div>
      <CallRecordings />
    </div>
  );
}
