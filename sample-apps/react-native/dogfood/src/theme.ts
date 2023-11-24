const opacityToHex = (opacity: number) => {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
};

export const appTheme = {
  colors: {
    static_grey: '#272A30',
    static_white: '#ffffff',
    static_overlay: '#080707' + opacityToHex(0.85),
    primary: '#005FFF',
    light_gray: '#979797',
    light_blue: '#669FFF',
    disabled: '#4C525C',
    dark_gray: '#1C1E22',
    error: '#FF3742',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  zIndex: {
    IN_BACK: 0,
    IN_MIDDLE: 1,
    IN_FRONT: 2,
  },
};
