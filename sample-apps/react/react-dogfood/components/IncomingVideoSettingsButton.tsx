import {
  CompositeButton,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

const incomingVideoSettings = [
  'auto',
  '2060p',
  '1080p',
  '720p',
  '480p',
  '144p',
  'off',
] as const;

type IncomingVideoSetting = (typeof incomingVideoSettings)[number];

export const IncomingVideoSettingsButton = () => {
  const call = useCall();
  const { useIncomingVideoSettings } = useCallStateHooks();
  const { enabled, preferredResolution } = useIncomingVideoSettings();
  const { t } = useI18n();
  const currentSetting = getIncomingVideoSetting(enabled, preferredResolution);

  const handleChange = (setting: IncomingVideoSetting) => {
    if (setting === 'auto' || setting === 'off') {
      call?.setIncomingVideoEnabled(setting === 'auto');
      return;
    }

    call?.setPreferredIncomingVideoResolution(
      getIncomingVideoResolution(setting),
    );
  };

  return (
    <CompositeButton
      className="rd__incoming-video-settings__button"
      Menu={
        <IncomingVideoSettingsMenu
          value={currentSetting}
          onChange={handleChange}
        />
      }
      menuPlacement="top"
      disabled
    >
      {t(`quality/short/${currentSetting}`)}
    </CompositeButton>
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

function getIncomingVideoSetting(
  enabled: boolean,
  preferredResolution?: { height: number },
): IncomingVideoSetting {
  switch (true) {
    case !enabled:
      return 'off';
    case preferredResolution && preferredResolution.height >= 2060:
      return '2060p';
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
    case '2060p':
      return { width: 3940, height: 2060 };
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
