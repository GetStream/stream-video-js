import { Platform, TextStyle } from 'react-native';

type FontTypes = 'heading4' | 'heading5' | 'heading6';

type FontStyle = {
  fontSize: TextStyle['fontSize'];
  fontWeight: TextStyle['fontWeight'];
};

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
  },
});
