import { setPushConfig } from './utils/setPushConfig';
import { setFirebaseListeners } from './utils/setFirebaseListeners';

setPushConfig();
setFirebaseListeners();

require('expo-router/entry');
