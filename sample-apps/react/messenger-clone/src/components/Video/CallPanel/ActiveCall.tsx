import {
  CallControls,
  DeviceSettings,
  Stage,
} from '@stream-io/video-react-sdk';
import {
  ActiveCall as ActiveCallType,
  StreamVideoParticipant,
} from '@stream-io/video-client';

type ActiveCallProps = {
  callData: ActiveCallType['data'];
  callController: ActiveCallType['connection'];
  participants: StreamVideoParticipant[];
};
export const ActiveCall = ({
  callData,
  callController,
  participants,
}: ActiveCallProps) => {
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
