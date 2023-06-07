import {
  CallControls,
  DeviceSettings,
  SpeakerLayout,
  useCall,
} from '@stream-io/video-react-sdk';

export const MeetingUI = () => {
  const activeCall = useCall();
  if (!activeCall || !activeCall.cid) return null;
  return (
    <div className="str-video__call">
      <div className="str-video__call-header">
        <h4 className="str-video__call-header-title">{activeCall.cid}</h4>
        <DeviceSettings />
      </div>
      <SpeakerLayout />
      <CallControls />
    </div>
  );
};
