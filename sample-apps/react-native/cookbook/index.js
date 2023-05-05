/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
/** URL polyfill */
import 'text-encoding-polyfill';
/** Text decoder polyfill */
import 'react-native-url-polyfill/auto';
/** crypto.getRandomValues polyfill for uuid */
import 'react-native-get-random-values';
/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';
import {registerGlobals} from 'react-native-webrtc';

// We're registering globals, because our video JS client is serving SDKs that use browser based webRTC functions.
// This will result in creation of 2 global objects: `window` and `navigator`
// Further [reading](https://github.com/react-native-webrtc/react-native-webrtc/blob/16cff1523da457dbcc27bb0744ee2bad3a987c41/Documentation/BasicUsage.md#registering-globals) about this process
if (Platform.OS !== 'web') {
  registerGlobals();
}

AppRegistry.registerComponent(appName, () => App);
