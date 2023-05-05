import {
  Call,
  CallControls,
  DeviceSettings,
  Stage,
} from '@stream-io/video-react-sdk';

export const ActiveCall = (props: { call: Call }) => {
  const { call } = props;
  const { type, id } = call;
  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {type}:{id}
        </h4>
        <DeviceSettings />
      </div>
      <Stage call={call} />
      <CallControls call={call} />
    </div>
  );
};
