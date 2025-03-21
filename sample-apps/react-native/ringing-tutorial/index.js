import 'expo-router/entry';
import { setPushConfig } from './utils/setPushConfig';
import { setFirebaseListeners } from './utils/setFirebaseListeners';

setPushConfig();
setFirebaseListeners();
