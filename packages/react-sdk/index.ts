import { setSdkInfo, SfuModels } from '@stream-io/video-client';
import { version } from './version';

export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';
export * from '@stream-io/i18n';

export * from './src/core';

export * from './src/components';
export * from './src/types';
export * from './src/translations';
export {
  useHorizontalScrollPosition,
  useVerticalScrollPosition,
} from './src/hooks';

const [major, minor, patch] = version.split('.');

setSdkInfo({
  type: SfuModels.SdkType.REACT,
  major,
  minor,
  patch,
});
