/** Added 'react-native-gesture-handler' for Chat SDK */
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import * as Sentry from '@sentry/react-native';
import App from './App';
import { name as appName } from './app.json';

Sentry.init({
  dsn: 'https://3f853df83a5843bfa09a1e0dc785dbf6@o14368.ingest.sentry.io/4504248362926080',
});

const SentryApp = Sentry.wrap(App);
AppRegistry.registerComponent(appName, () => SentryApp);
