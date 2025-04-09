import {
  DropDownSelect,
  DropDownSelectOption,
  useI18n,
} from '@stream-io/video-react-sdk';
import { useState } from 'react';

const deviceSelectionOptions = ['system', 'recent'] as const;

export const DeviceSelectionSettingsDropdown = ({
  title,
  key,
}: {
  title: string;
  key: string;
}) => {
  const { t } = useI18n();
  const [currentSetting, setCurrentSetting] = useState<
    (typeof deviceSelectionOptions)[number]
  >(() =>
    window.localStorage.getItem(key) === 'disabled' ? 'system' : 'recent',
  );
  const currentIndex = deviceSelectionOptions.indexOf(currentSetting);

  const handleChange = (index: number) => {
    const nextSetting = deviceSelectionOptions[index];
    setCurrentSetting(nextSetting);

    if (nextSetting === 'system') {
      window.localStorage.setItem(key, 'disabled');
    } else {
      window.localStorage.removeItem(key);
    }
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
