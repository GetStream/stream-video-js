import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { StreamTheme } from '@stream-io/video-react-sdk';
import { useLanguage } from '../hooks/useLanguage';
import {
  DeviceSelectionPreference,
  useDeviceSelectionPreference,
} from '../hooks/useDeviceSelectionPreference';
import { ThemeMode, useThemeMode } from '../hooks/useThemeMode';
import { usePersistedToggle } from '../hooks/usePersistedToggle';

export type SegmentationModel =
  | 'selfie_segmenter_landscape'
  | 'selfie_multiclass_256x256'
  | 'selfie_segmenter';

const VALID_SEGMENTATION_MODELS: SegmentationModel[] = [
  'selfie_segmenter_landscape',
  'selfie_multiclass_256x256',
  'selfie_segmenter',
];

const defaultState: Settings = {
  deviceSelectionPreference: 'recent',
  setDeviceSelectionPreference: () => {},
  speakingDetectionEnabled: true,
  setSpeakingDetectionEnabled: () => {},
  segmentationModel: 'selfie_segmenter_landscape',
  setSegmentationModel: () => {},
  themeMode: 'dark',
  setThemeMode: () => {},
};

export type Settings = {
  language?: string;
  setLanguage?: (value: string) => void;
  deviceSelectionPreference: DeviceSelectionPreference;
  setDeviceSelectionPreference: (value: DeviceSelectionPreference) => void;
  speakingDetectionEnabled: boolean;
  setSpeakingDetectionEnabled: (value: boolean) => void;
  segmentationModel: SegmentationModel;
  setSegmentationModel: (value: SegmentationModel) => void;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
};

export type SettingsContextValue = {
  settings: Settings;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultState,
});

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const { language, setLanguage } = useLanguage();
  const { deviceSelectionPreference, setDeviceSelectionPreference } =
    useDeviceSelectionPreference();
  const [speakingDetectionEnabled, setSpeakingDetectionEnabled] =
    usePersistedToggle('@pronto/speaking-detection-enabled', true);
  const { themeMode, setThemeMode } = useThemeMode();

  const [segmentationModel, setSegmentationModel] = useState<SegmentationModel>(
    () => {
      try {
        const stored = JSON.parse(
          localStorage.getItem('@pronto/video-filter')!,
        );
        const model = stored?.segmentationModel;
        if (VALID_SEGMENTATION_MODELS.includes(model)) return model;
      } catch {}

      return defaultState.segmentationModel;
    },
  );

  const settings: Settings = {
    language,
    setLanguage,
    deviceSelectionPreference,
    setDeviceSelectionPreference,
    speakingDetectionEnabled,
    setSpeakingDetectionEnabled,
    segmentationModel,
    setSegmentationModel,
    themeMode,
    setThemeMode,
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
      }}
    >
      <StreamTheme theme={themeMode}>{children}</StreamTheme>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
