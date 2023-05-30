import { Call } from '@stream-io/video-client';
import { useHasOngoingScreenShare } from '@stream-io/video-react-bindings';

import { CallParticipantsView } from './CallParticipantsView';
import { CallParticipantsScreenView } from './CallParticipantsScreenView';

/**
 * @deprecated
 */
export const Stage = (props: { call: Call }) => {
  const { call } = props;
  const hasScreenShare = useHasOngoingScreenShare();
  return (
    <div className="str-video__stage">
      {hasScreenShare ? (
        <CallParticipantsScreenView call={call} />
      ) : (
        <CallParticipantsView />
      )}
    </div>
  );
};
