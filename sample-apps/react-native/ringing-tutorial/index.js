import { setPushConfig } from './utils/setPushConfig';
import { setFirebaseListeners } from './utils/setFirebaseListeners';

setPushConfig();
setFirebaseListeners();

// always import expo-router/entry at the end of the file
import 'expo-router/entry';
