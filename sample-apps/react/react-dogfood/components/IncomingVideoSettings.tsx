import {
  DropDownSelect,
  DropDownSelectOption,
  Icon,
  IconButton,
  MenuToggle,
  type ToggleMenuButtonProps,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { forwardRef, useCallback } from 'react';

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

const QualityControlCaret = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>(function QualityControlCaretRender({ menuShown }, ref) {
  const { t } = useI18n();
  return (
    <IconButton
      ref={ref}
      size="xs"
      variant="secondary"
      appearance="ghost"
      aria-label={t('Incoming video quality')}
      aria-haspopup="menu"
      aria-expanded={menuShown}
      icon={menuShown ? 'caret-down' : 'caret-up'}
    />
  );
});

export const IncomingVideoSettingsButton = () => {
  const { t } = useI18n();
  const { currentSetting, onChange } = useIncomingVideoSettingsSelector();

  return (
    <div className="rd__quality-control">
      <span className="rd__quality-control__face">
        <Icon icon="sliders-fill" />
        {t(`quality/short/${currentSetting}`)}
      </span>
      <MenuToggle placement="top" ToggleButton={QualityControlCaret}>
        <IncomingVideoSettingsMenu value={currentSetting} onChange={onChange} />
      </MenuToggle>
    </div>
  );
};

export const IncomingVideoSettingsDropdown = ({ title }: { title: string }) => {
  const { t } = useI18n();
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
        defaultSelectedLabel={t(`quality/long/${currentSetting}`)}
        handleSelect={onChange}
      >
        {incomingVideoSettings.map((value) => {
          return (
            <DropDownSelectOption
              key={value}
              label={t(`quality/long/${value}`)}
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
  const { t } = useI18n();

  return (
    <div className="rd__layout-selector__list">
      {incomingVideoSettings.map((value) => (
        <div key={value} className="rd__layout-selector__item">
          <button
            className={clsx('rd__button rd__button--align-left', {
              'rd__button--primary': value === props.value,
            })}
            type="button"
            data-testid={`incoming-video-resolution-${value}`}
            onClick={() => props.onChange(value as IncomingVideoSetting)}
          >
            <span className="str-video__dropdown-label">
              {t(`quality/long/${value}`)}
            </span>
          </button>
        </div>
      ))}
    </div>
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
