import { Platform } from 'react-native';
import { FontStyle, FontTypes } from './types';

export const fonts: Record<FontTypes, FontStyle> = Platform.select({
  ios: {
    heading4: {
      fontSize: 34,
      fontWeight: '400',
    },
    heading5: {
      fontSize: 24,
      fontWeight: '400',
    },
    heading6: {
      fontSize: 20,
      fontWeight: '500',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400',
    },
    subtitleBold: {
      fontSize: 16,
      fontWeight: '500',
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600',
    },
    caption: {
      fontSize: 10,
      fontWeight: '400',
    },
  },
  default: {
    heading4: {
      fontSize: 34,
      fontWeight: '400',
    },
    heading5: {
      fontSize: 24,
      fontWeight: '400',
    },
    heading6: {
      fontSize: 20,
      fontWeight: '500',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400',
    },
    subtitleBold: {
      fontSize: 16,
      fontWeight: '500',
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600',
    },
    caption: {
      fontSize: 10,
      fontWeight: '400',
    },
  },
});
