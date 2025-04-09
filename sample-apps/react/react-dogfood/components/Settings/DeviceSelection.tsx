import {
  DropDownSelect,
  DropDownSelectOption,
  useI18n,
} from '@stream-io/video-react-sdk';
import { DeviceSelectionPreference } from '../../hooks/useDeviceSelectionPreference';
import { useSettings } from '../../context/SettingsContext';

const deviceSelectionOptions: DeviceSelectionPreference[] = [
  'system',
  'recent',
];

export const DeviceSelectionSettingsDropdown = ({
  title,
}: {
  title: string;
}) => {
  const { t } = useI18n();
  const {
    settings: {
      deviceSelectionPreference: currentSetting,
      setDeviceSelectionPreference: setCurrentSetting,
    },
  } = useSettings();
  const currentIndex = deviceSelectionOptions.indexOf(currentSetting);

  const handleChange = (index: number) => {
    const nextSetting = deviceSelectionOptions[index];
    setCurrentSetting(nextSetting);
  };

  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-title">
        {title}
      </div>
      <DropDownSelect
        defaultSelectedIndex={currentIndex}
        defaultSelectedLabel={t(`device-selection/${currentSetting}`)}
        handleSelect={handleChange}
      >
        {deviceSelectionOptions.map((value) => {
          return (
            <DropDownSelectOption
              key={value}
              label={t(`device-selection/${value}`)}
              selected={value === currentSetting}
            />
          );
        })}
      </DropDownSelect>
    </div>
  );
};
