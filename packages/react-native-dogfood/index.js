/**
 * @format
 */
/** URL polyfill */
import 'text-encoding-polyfill';
/** Text decoder polyfill */
import 'react-native-url-polyfill/auto';
/** crypto.getRandomValues polyfill for uuid */
import 'react-native-get-random-values';

import { RTCRtpSender, RTCRtpReceiver } from 'react-native-webrtc';

global.RTCRtpSender = RTCRtpSender;
global.RTCRtpReceiver = RTCRtpReceiver;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerHeadlessTask(
  'RNCallKeepBackgroundMessage',
  () =>
    ({ name, callUUID, handle }) => {
      // TODO: Make your call here

      return Promise.resolve();
    },
);

AppRegistry.registerComponent(appName, () => App);
