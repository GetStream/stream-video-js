/** Text decoder polyfill */
import 'text-encoding-polyfill';
/** URL polyfill */
import 'react-native-url-polyfill/auto';
/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';
/** Added 'react-native-gesture-handler' for Chat SDK */
import 'react-native-gesture-handler';

import { registerGlobals } from 'react-native-webrtc';

import { AppRegistry, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import App from './App';
import { name as appName } from './app.json';

if (Platform.OS !== 'web') {
  registerGlobals();
}

AppRegistry.registerHeadlessTask(
  'RNCallKeepBackgroundMessage',
  () =>
    ({ name, callUUID, handle }) => {
      // TODO: Make your call here

      return Promise.resolve();
    },
);

Sentry.init({
  dsn: 'https://3f853df83a5843bfa09a1e0dc785dbf6@o14368.ingest.sentry.io/4504248362926080',
});

const SentryApp = Sentry.wrap(App);
AppRegistry.registerComponent(appName, () => SentryApp);
