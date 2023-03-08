import { colors } from './colors';
import { fonts } from './fonts';
import { padding } from './padding';
import { margin } from './margin';
import { Theme } from './types';

const { light, dark } = colors;

export const theme: Theme = {
  light,
  dark,
  fonts,
  padding,
  margin,
};
