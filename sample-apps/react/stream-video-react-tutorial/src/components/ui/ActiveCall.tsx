import {
  Call,
  CallControls,
  DeviceSettings,
  MediaDevicesProvider,
  Stage,
  StreamCallProvider,
} from '@stream-io/video-react-sdk';

export const ActiveCall = (props: { call: Call }) => {
  const { call } = props;
  const { type, id } = call;
  return (
    <StreamCallProvider call={call}>
      <MediaDevicesProvider>
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
      </MediaDevicesProvider>
    </StreamCallProvider>
  );
};
