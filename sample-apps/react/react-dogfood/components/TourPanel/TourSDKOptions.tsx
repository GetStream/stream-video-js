import { Icon } from '@stream-io/video-react-sdk';

export const TourSDKOptions = () => {
  return (
    <div className="rd__sdk-options">
      <div className="rd__sdk-options__option">
        <Icon icon="layout-speaker-live-stream" />
        Livestreaming
      </div>
      <div className="rd__sdk-options__option">
        <Icon icon="mic" />
        Audio Rooms
      </div>
      <div className="rd__sdk-options__option">
        <Icon icon="camera" />
        Video Calling
      </div>
      <div className="rd__sdk-options__option">
        <Icon icon="call-accept" />
        Audio Calling
      </div>
    </div>
  );
};
