import { useActiveCall } from '@stream-io/video-react-bindings';
import {
  CallControls,
  DeviceSettings,
  Stage,
} from '@stream-io/video-react-sdk';

export const MeetingUI = () => {
  const activeCall = useActiveCall();

  if (!activeCall || !activeCall.data.call.cid) return null;

  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {activeCall.data.call.cid}
        </h4>
        <DeviceSettings activeCall={activeCall} />
      </div>
      <Stage call={activeCall} />
      <CallControls call={activeCall} />
    </div>
  );
};
