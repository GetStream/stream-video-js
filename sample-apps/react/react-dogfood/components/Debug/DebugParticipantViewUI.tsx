import {
  DefaultParticipantViewUI,
  useCall,
  useParticipantViewContext,
} from '@stream-io/video-react-sdk';
import { DebugStatsView } from './DebugStatsView';
import { useIsDebugMode } from './useIsDebugMode';

export const DebugParticipantViewUI = () => {
  const call = useCall();
  const { participant } = useParticipantViewContext();
  const { sessionId, userId, videoStream } = participant;
  const isDebug = useIsDebugMode();
  if (!isDebug) return <DefaultParticipantViewUI />;
  return (
    <>
      <DefaultParticipantViewUI />
      <div className="rd__debug__extra">
        <DebugStatsView
          call={call!}
          sessionId={sessionId}
          userId={userId}
          mediaStream={videoStream}
        />
      </div>
    </>
  );
};
