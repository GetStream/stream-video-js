import {
  CallControls,
  DeviceSettings,
  Stage,
  useActiveCall,
} from '@stream-io/video-react-sdk';

export const ActiveCall = () => {
  const activeCall = useActiveCall();

  const { type, id } = activeCall.data.call || {
    type: 'Unknown Type',
    id: 'Unknown ID',
  };

  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {type}:{id}
        </h4>
        <DeviceSettings />
      </div>
      <Stage call={activeCall} />
      <CallControls call={activeCall} />
    </div>
  );
};
