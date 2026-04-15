import { setSdkInfo, SfuModels } from '@stream-io/video-client';

export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';

export * from './src/core';

export * from './src/components';
export * from './src/wrappers';
export * from './src/translations';
export {
  useHorizontalScrollPosition,
  useVerticalScrollPosition,
  useRequestPermission,
  usePersistedDevicePreferences,
  useDeviceList,
  useModeration,
} from './src/hooks';
export { applyFilter, type Filter } from './src/utilities/filter';

const [major, minor, patch] = (
  process.env.PKG_VERSION || '0.0.0-development'
).split('.');

setSdkInfo({
  type: SfuModels.SdkType.REACT,
  major,
  minor,
  patch,
});
