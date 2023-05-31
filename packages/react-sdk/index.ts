import { setSdkInfo, SfuModels } from '@stream-io/video-client';

export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';
export * from '@stream-io/i18n';

export * from './src/core';

export * from './src/components';
export * from './src/types';
export {
  useHorizontalScrollPosition,
  useVerticalScrollPosition,
} from './src/hooks';

// TODO: set valid version
setSdkInfo({
  type: SfuModels.SdkType.REACT,
  major: '0',
  minor: '0',
  patch: '0',
});
