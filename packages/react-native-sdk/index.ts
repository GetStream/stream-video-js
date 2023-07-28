import { setClientDetails } from './src/utils/setClientDetails';
/** Initialize text encoder/decoder polyfill */
import 'text-encoding-polyfill';
/** Initialize URL polyfill */
import 'react-native-url-polyfill/auto';
/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';
import { registerGlobals } from 'react-native-webrtc';
import { Platform } from 'react-native';

// We're registering globals, because our video JS client is serving SDKs that use browser based webRTC functions.
// This will result in creation of 2 global objects: `window` and `navigator`
// Reference: https://github.com/react-native-webrtc/react-native-webrtc/blob/16cff1523da457dbcc27bb0744ee2bad3a987c41/Documentation/BasicUsage.md#registering-globals
if (Platform.OS !== 'web') {
  registerGlobals();
}

export * from '@stream-io/i18n';
export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';
export * from './src/components';
export * from './src/contexts';
export * from './src/hooks';
export * from './src/theme';
export * from './src/utils';
export * from './src/translations';

// Overriding 'StreamVideo' from '@stream-io/video-react-bindings'
// Explicitly re-exporting to resolve ambiguity.
export {
  StreamVideo,
  StreamCall,
  MediaStreamManagement,
  useMediaStreamManagement,
} from './src/providers';

setClientDetails();
