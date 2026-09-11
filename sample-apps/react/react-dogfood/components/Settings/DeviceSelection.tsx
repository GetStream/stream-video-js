import {
  DropDownSelect,
  DropDownSelectOption,
} from '@stream-io/video-react-sdk';
import { DeviceSelectionPreference } from '../../hooks/useDeviceSelectionPreference';
import { useSettings } from '../../context/SettingsContext';
import { useAppI18n } from '../../hooks/useAppI18n';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';

const deviceSelectionOptions: DeviceSelectionPreference[] = [
  'system',
  'recent',
];

/**
 * Was keyed by interpolating the preference into a slash-path — a third naming convention nothing
 * else used. A `switch` over the two-member union keeps the English at the call site.
 */
const deviceSelectionLabel = (
  t: LooseTranslateFunction,
  preference: DeviceSelectionPreference,
) => {
  switch (preference) {
    case 'system':
      return t('settings.deviceSelection.system.label', 'Use system default');
    case 'recent':
      return t('settings.deviceSelection.recent.label', 'Most recently used');
  }
};

export const DeviceSelectionSettingsDropdown = ({
  title,
}: {
  title: string;
}) => {
  const { t } = useAppI18n();
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
        defaultSelectedLabel={deviceSelectionLabel(t, currentSetting)}
        handleSelect={handleChange}
      >
        {deviceSelectionOptions.map((value) => {
          return (
            <DropDownSelectOption
              key={value}
              label={deviceSelectionLabel(t, value)}
              selected={value === currentSetting}
            />
          );
        })}
      </DropDownSelect>
    </div>
  );
};
