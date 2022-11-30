import {
  CallControls,
  DeviceSettings,
  Stage,
  useParticipants,
} from '@stream-io/video-react-sdk';
import { ActiveCall as ActiveCallType } from '@stream-io/video-client';

type ActiveCallProps = {
  callData: ActiveCallType['data'];
  callController: ActiveCallType['connection'];
};
export const ActiveCall = ({ callData, callController }: ActiveCallProps) => {
  const participants = useParticipants();

  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {callData.call.type}:{callData.call.id}
        </h4>
        <DeviceSettings activeCall={callController} />
      </div>
      <Stage participants={participants} call={callController} />
      <CallControls call={callController} />
    </div>
  );
};
