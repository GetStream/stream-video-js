import { requireNativeComponent, type ViewStyle } from 'react-native';
import type { Broadcast } from './Broadcast';

export interface BroadcastVideoViewProps {
  style?: ViewStyle;
  broadcast: Broadcast;
}

interface NativeBroadcastVideoViewProps {
  style?: ViewStyle;
  instanceId: string;
}

const NativeBroadcastVideoView =
  requireNativeComponent<NativeBroadcastVideoViewProps>('BroadcastVideoView');

export const BroadcastVideoView = ({
  style,
  broadcast,
}: BroadcastVideoViewProps) => {
  return (
    <NativeBroadcastVideoView
      style={{ flex: 1, ...style }}
      instanceId={broadcast.id}
    />
  );
};
