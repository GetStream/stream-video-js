import {
  DeviceSelectorAudioInput,
  ToggleAudioPublishingButton,
  useTooltipContext,
} from '@stream-io/video-react-sdk';

export const ToggleDualMicButton = () => {
  const { hideTooltip } = useTooltipContext();
  return (
    <div className="rd__dual-toggle">
      <ToggleAudioPublishingButton
        Menu={<DeviceSelectorAudioInput visualType="list" title={undefined} />}
        menuPlacement="top"
        caption=""
        onMenuToggle={(menuShown) => menuShown && hideTooltip?.()}
      />
    </div>
  );
};
