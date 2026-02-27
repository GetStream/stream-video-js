import { Icon } from '../../../components';

interface DisabledDeviceButtonProps {
  icon: string;
  label: string;
}

export const DisabledDeviceButton = ({
  icon,
  label,
}: DisabledDeviceButtonProps) => (
  <div className="str-video__embedded-lobby__device-button str-video__embedded-lobby__device-button--disabled">
    <Icon
      className="str-video__embedded-lobby__device-button-icon"
      icon={icon}
    />
    <span className="str-video__embedded-lobby__device-button-label">
      {label}
    </span>
  </div>
);
