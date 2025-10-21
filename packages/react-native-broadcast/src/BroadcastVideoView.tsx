import { requireNativeComponent, type ViewStyle } from 'react-native';

export interface BroadcastVideoViewProps {
  style?: ViewStyle;
}

interface NativeBroadcastVideoViewProps {
  style?: ViewStyle;
}

const NativeBroadcastVideoView =
  requireNativeComponent<NativeBroadcastVideoViewProps>('BroadcastVideoView');

export const BroadcastVideoView = ({ style }: BroadcastVideoViewProps) => {
  return <NativeBroadcastVideoView style={{ flex: 1, ...style }} />;
};
