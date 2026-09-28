import {
  DropDownSelect,
  DropDownSelectOption,
} from '@stream-io/video-react-sdk';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';
import type { ThemeMode } from '../../hooks/useThemeMode';
import { useSettings } from '../../context/SettingsContext';
import { useAppI18n } from '../../hooks/useAppI18n';

const themeModeOptions: ThemeMode[] = ['light', 'dark'];

const themeModeLabel = (t: LooseTranslateFunction, mode: ThemeMode) => {
  switch (mode) {
    case 'light':
      return t('settings.theme.light.label', 'Light');
    case 'dark':
      return t('settings.theme.dark.label', 'Dark');
  }
};

export const ThemeMenu = () => {
  const { t } = useAppI18n();
  const {
    settings: { themeMode, setThemeMode },
  } = useSettings();

  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-title">
        {t('settings.theme.title', 'Appearance')}
      </div>
      <DropDownSelect
        key={themeMode}
        defaultSelectedIndex={themeModeOptions.indexOf(themeMode)}
        defaultSelectedLabel={themeModeLabel(t, themeMode)}
        handleSelect={(index) => setThemeMode(themeModeOptions[index])}
      >
        {themeModeOptions.map((mode) => (
          <DropDownSelectOption
            key={mode}
            label={themeModeLabel(t, mode)}
            selected={mode === themeMode}
          />
        ))}
      </DropDownSelect>
    </div>
  );
};
