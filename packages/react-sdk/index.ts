import { setSdkInfo, SfuModels } from '@stream-io/video-client';

export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';

export * from './src/components';
export * from './src/contexts';
export * from './src/hooks';
export * from './src/types';

// TODO: set valid version
setSdkInfo({
  type: SfuModels.SdkType.REACT,
  major: '0',
  minor: '0',
  patch: '0',
});
