/**
 * @format
 */
/** URL polyfill */
import 'text-encoding-polyfill';
/** Text decoder polyfill */
import 'react-native-url-polyfill/auto';
/** crypto.getRandomValues polyfill for uuid */
import 'react-native-get-random-values';
/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';

import {registerGlobals} from 'react-native-webrtc';

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

if (Platform.OS !== 'web') {
  registerGlobals();
}

AppRegistry.registerComponent(appName, () => App);
