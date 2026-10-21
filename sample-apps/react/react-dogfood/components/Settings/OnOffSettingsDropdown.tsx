import {
  DropDownSelect,
  DropDownSelectOption,
} from '@stream-io/video-react-sdk';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../../hooks/useAppI18n';

const onOffOptions = [true, false];

const onOffLabel = (t: LooseTranslateFunction, enabled: boolean) =>
  enabled
    ? t('settings.onOff.on.label', 'On')
    : t('settings.onOff.off.label', 'Off');

export const OnOffSettingsDropdown = ({
  title,
  enabled,
  setEnabled,
}: {
  title: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) => {
  const { t } = useAppI18n();

  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-title">
        {title}
      </div>
      <DropDownSelect
        defaultSelectedIndex={onOffOptions.indexOf(enabled)}
        defaultSelectedLabel={onOffLabel(t, enabled)}
        handleSelect={(index) => setEnabled(onOffOptions[index])}
      >
        {onOffOptions.map((option) => (
          <DropDownSelectOption
            key={String(option)}
            label={onOffLabel(t, option)}
            selected={option === enabled}
          />
        ))}
      </DropDownSelect>
    </div>
  );
};
