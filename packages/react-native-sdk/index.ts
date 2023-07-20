import { setClientDetails } from './src/utils/setClientDetails';

export * from '@stream-io/i18n';
export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';
export * from './src/components';
export * from './src/contexts';
export * from './src/hooks';
export * from './src/theme';
export * from './src/utils';

// Overriding 'StreamVideo' from '@stream-io/video-react-bindings'
// Explicitly re-exporting to resolve ambiguity.
export {
  StreamVideo,
  StreamCall,
  MediaStreamManagement,
  useMediaStreamManagement,
} from './src/providers';

setClientDetails();
