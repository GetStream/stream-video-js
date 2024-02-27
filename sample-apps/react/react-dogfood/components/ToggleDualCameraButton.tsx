import clsx from 'clsx';

import {
  DeviceSelectorVideo,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';

export const ToggleDualCameraButton = () => {
  return (
    <div className={clsx('rd__dual-toggle')}>
      <ToggleVideoPublishingButton
        Menu={<DeviceSelectorVideo visualType="list" />}
        menuPlacement="top"
      />
    </div>
  );
};
