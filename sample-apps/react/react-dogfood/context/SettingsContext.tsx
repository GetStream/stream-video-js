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

const SEGMENTATION_MODEL_URLS: Record<SegmentationModel, string> = {
  selfie_segmenter_landscape:
    'https://unpkg.com/@stream-io/video-filters-web@latest/mediapipe/models/selfie_segmenter_landscape.tflite',
  selfie_multiclass_256x256:
    'https://unpkg.com/@stream-io/video-filters-web@latest/mediapipe/models/selfie_multiclass_256x256.tflite',
  selfie_segmenter:
    'https://unpkg.com/@stream-io/video-filters-web@latest/mediapipe/models/selfie_segmenter.tflite',
};

export const getSegmentationModelUrl = (model: SegmentationModel) =>
  SEGMENTATION_MODEL_URLS[model];

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
    defaultState.segmentationModel,
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
