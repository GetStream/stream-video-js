import {
  CallControls,
  DeviceSettings,
  Stage,
  useActiveCall,
} from '@stream-io/video-react-sdk';

export const MeetingUI = () => {
  const activeCall = useActiveCall();

  if (!activeCall || !activeCall.cid) return null;

  return (
    <div className="str-video__call">
      <div className="str-video__call-header">
        <h4 className="str-video__call-header-title">{activeCall.cid}</h4>
        <DeviceSettings />
      </div>
      <Stage call={activeCall} />
      <CallControls call={activeCall} />
    </div>
  );
};
