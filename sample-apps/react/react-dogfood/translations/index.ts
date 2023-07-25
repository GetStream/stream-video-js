import de from './de.json';
import en from './en.json';
import es from './es.json';

import { translations as sdkTranslations } from '@stream-io/video-react-sdk';

const appTranslations = { de, en: { ...sdkTranslations.en, ...en }, es };
export default appTranslations;
