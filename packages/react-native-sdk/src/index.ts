import { setClientDetails } from './utils/setClientDetails';
/** Initialize text encoder/decoder polyfill */
import 'text-encoding-polyfill';
/** Initialize URL polyfill */
import 'react-native-url-polyfill/auto';
/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';
import { registerGlobals } from '@stream-io/react-native-webrtc';
import Logger from '@stream-io/react-native-webrtc/src/Logger';
import { Platform } from 'react-native';

// We're registering globals, because our video JS client is serving SDKs that use browser based webRTC functions.
// This will result in creation of 2 global objects: `window` and `navigator`
// Reference: https://github.com/react-native-webrtc/react-native-webrtc/blob/16cff1523da457dbcc27bb0744ee2bad3a987c41/Documentation/BasicUsage.md#registering-globals
if (Platform.OS !== 'web') {
  registerGlobals();
}

// only enable warning and error logs from webrtc library
Logger.enable(`${Logger.ROOT_PREFIX}:(WARN|ERROR)`);

export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';
export * from './components';
export * from './contexts';
export * from './hooks';
export * from './theme';
export * from './utils';
export * from './translations';

// Overriding 'StreamVideo' from '@stream-io/video-react-bindings'
// Explicitly re-exporting to resolve ambiguity.
export { StreamVideo, StreamCall, MediaStreamManagement } from './providers';

setClientDetails();
