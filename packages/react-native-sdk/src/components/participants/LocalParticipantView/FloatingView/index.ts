import {
  getGestureHandlerLib,
  getReanimatedLib,
} from '../../../../utils/internal/optionalLibs';
import { FloatingViewProps } from './common';

const reanimLib = getReanimatedLib();
const gestureHandlerLib = getGestureHandlerLib();

const FloatingView: React.FC<FloatingViewProps> =
  reanimLib && gestureHandlerLib
    ? require('./ReanimatedFloatingView').default
    : require('./AnimatedFloatingView').default;

if (!reanimLib || !gestureHandlerLib) {
  console.info(
    'react-native-reanimated and/or react-native-gesture-handler libraries are not installed. Please install them to get a more performant draggable local video component',
  );
}

export default FloatingView;
