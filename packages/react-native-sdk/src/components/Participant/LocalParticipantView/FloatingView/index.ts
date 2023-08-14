import {
  getGestureHandlerLib,
  getReanimatedLib,
} from '../../../../utils/internal/optionalLibs';
import { FloatingViewProps } from './common';

const FloatingView: React.FC<FloatingViewProps> =
  getReanimatedLib() && getGestureHandlerLib()
    ? require('./ReanimatedFloatingView').default
    : require('./AnimatedFloatingView').default;

export default FloatingView;
