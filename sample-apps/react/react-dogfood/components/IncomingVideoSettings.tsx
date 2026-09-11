import {
  DropDownSelect,
  DropDownSelectOption,
  GenericMenu,
  GenericMenuButtonItem,
  Icon,
  IconButton,
  MenuToggle,
  type ToggleMenuButtonProps,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { forwardRef, useCallback } from 'react';
import { useAppI18n } from '../hooks/useAppI18n';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';

const incomingVideoSettings = [
  'auto',
  '2160p',
  '1080p',
  '720p',
  '480p',
  '144p',
  'off',
] as const;

type IncomingVideoSetting = (typeof incomingVideoSettings)[number];

/**
 * The two label sets used to be keyed by interpolating the setting into a slash-path, which left
 * the copy invisible at the call site and impossible to type. A `switch` over the closed union puts
 * each key back together with its English, and the compiler checks every member is covered.
 */
const shortQualityLabel = (
  t: LooseTranslateFunction,
  s: IncomingVideoSetting,
) => {
  switch (s) {
    case 'auto':
      return t('settings.incomingVideoQuality.short.auto.label', 'Auto');
    case '2160p':
      return t('settings.incomingVideoQuality.short.2160p.label', '2160p');
    case '1080p':
      return t('settings.incomingVideoQuality.short.1080p.label', '1080p');
    case '720p':
      return t('settings.incomingVideoQuality.short.720p.label', '720p');
    case '480p':
      return t('settings.incomingVideoQuality.short.480p.label', '480p');
    case '144p':
      return t('settings.incomingVideoQuality.short.144p.label', '144p');
    case 'off':
      return t('settings.incomingVideoQuality.short.off.label', 'Video off');
  }
};

const longQualityLabel = (
  t: LooseTranslateFunction,
  s: IncomingVideoSetting,
) => {
  switch (s) {
    case 'auto':
      return t('settings.incomingVideoQuality.long.auto.label', 'Auto quality');
    case '2160p':
      return t('settings.incomingVideoQuality.long.2160p.label', '4K 2160p');
    case '1080p':
      return t(
        'settings.incomingVideoQuality.long.1080p.label',
        'Full HD 1080p',
      );
    case '720p':
      return t('settings.incomingVideoQuality.long.720p.label', 'HD 720p');
    case '480p':
      return t('settings.incomingVideoQuality.long.480p.label', 'SD 480p');
    case '144p':
      return t(
        'settings.incomingVideoQuality.long.144p.label',
        'Data saver 144p',
      );
    case 'off':
      return t('settings.incomingVideoQuality.long.off.label', 'Disable video');
  }
};

const QualityControlCaret = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>(function QualityControlCaretRender({ menuShown }, ref) {
  const { t } = useAppI18n();
  return (
    <IconButton
      ref={ref}
      size="xs"
      variant="secondary"
      appearance="ghost"
      aria-label={t(
        'settings.incomingVideoQuality.title',
        'Incoming video quality',
      )}
      aria-haspopup="menu"
      aria-expanded={menuShown}
      icon={menuShown ? 'caret-down' : 'caret-up'}
    />
  );
});

export const IncomingVideoSettingsButton = () => {
  const { t } = useAppI18n();
  const { currentSetting, onChange } = useIncomingVideoSettingsSelector();

  return (
    <div className="rd__quality-control">
      <span className="rd__quality-control__face">
        <Icon icon="sliders-fill" />
        {shortQualityLabel(t, currentSetting)}
      </span>
      <MenuToggle placement="top" ToggleButton={QualityControlCaret}>
        <IncomingVideoSettingsMenu value={currentSetting} onChange={onChange} />
      </MenuToggle>
    </div>
  );
};

export const IncomingVideoSettingsDropdown = ({ title }: { title: string }) => {
  const { t } = useAppI18n();
  const { currentSetting, currentIndex, onChange } =
    useIncomingVideoSettingsSelector();

  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-title">
        {title}
      </div>
      <DropDownSelect
        icon="sliders-fill"
        defaultSelectedIndex={currentIndex}
        defaultSelectedLabel={longQualityLabel(t, currentSetting)}
        handleSelect={onChange}
      >
        {incomingVideoSettings.map((value) => {
          return (
            <DropDownSelectOption
              key={value}
              label={longQualityLabel(t, value)}
              selected={value === currentSetting}
            />
          );
        })}
      </DropDownSelect>
    </div>
  );
};

const IncomingVideoSettingsMenu = (props: {
  value: IncomingVideoSetting;
  onChange: (value: IncomingVideoSetting) => void;
}) => {
  const { t } = useAppI18n();

  return (
    <GenericMenu>
      {incomingVideoSettings.map((value) => (
        <GenericMenuButtonItem
          key={value}
          aria-current={value === props.value}
          data-testid={`incoming-video-resolution-${value}`}
          onClick={() => props.onChange(value)}
        >
          {longQualityLabel(t, value)}
        </GenericMenuButtonItem>
      ))}
    </GenericMenu>
  );
};

function useIncomingVideoSettingsSelector() {
  const call = useCall();
  const { useIncomingVideoSettings } = useCallStateHooks();
  const { enabled, preferredResolution } = useIncomingVideoSettings();
  const currentSetting = getIncomingVideoSetting(enabled, preferredResolution);
  const currentIndex = incomingVideoSettings.indexOf(currentSetting);

  const onChange = useCallback(
    (settingOrIndex: IncomingVideoSetting | number) => {
      const setting: IncomingVideoSetting =
        typeof settingOrIndex === 'number'
          ? incomingVideoSettings[settingOrIndex]
          : settingOrIndex;

      if (setting === 'auto' || setting === 'off') {
        call?.setIncomingVideoEnabled(setting === 'auto');
        return;
      }

      call?.setPreferredIncomingVideoResolution(
        getIncomingVideoResolution(setting),
      );
    },
    [call],
  );

  return {
    currentSetting,
    currentIndex,
    onChange,
  };
}

function getIncomingVideoSetting(
  enabled: boolean,
  preferredResolution?: { height: number },
): IncomingVideoSetting {
  switch (true) {
    case !enabled:
      return 'off';
    case preferredResolution && preferredResolution.height >= 2160:
      return '2160p';
    case preferredResolution && preferredResolution.height >= 1080:
      return '1080p';
    case preferredResolution && preferredResolution.height >= 720:
      return '720p';
    case preferredResolution && preferredResolution.height >= 480:
      return '480p';
    case preferredResolution && preferredResolution.height >= 144:
      return '144p';
    default:
      return 'auto';
  }
}

function getIncomingVideoResolution(
  setting: Exclude<IncomingVideoSetting, 'auto' | 'off'>,
) {
  switch (setting) {
    case '2160p':
      return { width: 3840, height: 2160 };
    case '1080p':
      return { width: 1920, height: 1080 };
    case '720p':
      return { width: 1280, height: 720 };
    case '480p':
      return { width: 640, height: 480 };
    case '144p':
      return { width: 256, height: 144 };
  }
}
