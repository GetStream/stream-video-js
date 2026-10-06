import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useCallDuration } from '../hooks';
import { CancelCallConfirmButton } from '../../components';
import { CallDuration } from '../shared';

/**
 * Renders the call header bar with elapsed time and leave/end call button.
 */
export const CallHeader = () => {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  const startedAt = session?.started_at;
  const { elapsed } = useCallDuration(startedAt);

  return (
    <div className="str-video__embedded-call-header">
      {startedAt && <CallDuration elapsed={elapsed} />}
      <CancelCallConfirmButton />
    </div>
  );
};
