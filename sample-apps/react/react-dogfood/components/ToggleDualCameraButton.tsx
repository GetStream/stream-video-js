import clsx from 'clsx';

import {
  DeviceSelectorVideo,
  ToggleVideoPublishingButton,
  useTooltipContext,
} from '@stream-io/video-react-sdk';

export const ToggleDualCameraButton = () => {
  const { hideTooltip } = useTooltipContext();
  return (
    <div className={clsx('rd__dual-toggle')}>
      <ToggleVideoPublishingButton
        Menu={<DeviceSelectorVideo visualType="list" />}
        menuPlacement="top"
        onMenuToggle={(menuShown) => menuShown && hideTooltip?.()}
        caption=""
      />
    </div>
  );
};
