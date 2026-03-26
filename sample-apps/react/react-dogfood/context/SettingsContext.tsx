import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import {
  DeviceSelectionPreference,
  useDeviceSelectionPreference,
} from '../hooks/useDeviceSelectionPreference';

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
  segmentationModel: 'selfie_segmenter_landscape',
  setSegmentationModel: () => {},
};

export type Settings = {
  language?: string;
  fallbackLanguage?: string;
  setLanguage?: (value: string) => void;
  deviceSelectionPreference: DeviceSelectionPreference;
  setDeviceSelectionPreference: (value: DeviceSelectionPreference) => void;
  segmentationModel: SegmentationModel;
  setSegmentationModel: (value: SegmentationModel) => void;
};

export type SettingsContextValue = {
  settings: Settings;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultState,
});

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const { language, setLanguage, fallbackLanguage } = useLanguage();
  const { deviceSelectionPreference, setDeviceSelectionPreference } =
    useDeviceSelectionPreference();

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
    fallbackLanguage,
    setLanguage,
    deviceSelectionPreference,
    setDeviceSelectionPreference,
    segmentationModel,
    setSegmentationModel,
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
