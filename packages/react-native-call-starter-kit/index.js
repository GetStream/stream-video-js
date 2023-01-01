/** URL polyfill */
import 'text-encoding-polyfill';
/** Text decoder polyfill */
import 'react-native-url-polyfill/auto';
/** crypto.getRandomValues polyfill for uuid */
import 'react-native-get-random-values';
import 'react-native-gesture-handler';

import {registerGlobals} from 'react-native-webrtc';

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

if (Platform.OS !== 'web') {
  registerGlobals();
}

AppRegistry.registerComponent(appName, () => App);
