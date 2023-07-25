import en from './en.json';

import { translations as sdkTranslations } from '@stream-io/video-react-native-sdk';

const appTranslations = { en: { ...sdkTranslations.en, ...en } };
export default appTranslations;
