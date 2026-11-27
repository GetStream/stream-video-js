import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  useIsCallLive,
  useIsCallHLSBroadcastingInProgress,
} from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';
import { FollowerCount } from '../LivestreamTopView/FollowerCount';
import { LiveIndicator } from '../LivestreamTopView/LiveIndicator';

type HostStatusPanelProps = {
  humanizeFollowerCount?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const HostStatusPanel = ({
  humanizeFollowerCount = true,
  style,
}: HostStatusPanelProps) => {
  const isCallLive = useIsCallLive();
  const isBroadcasting = useIsCallHLSBroadcastingInProgress();
  const liveOrBroadcasting = isCallLive || isBroadcasting;
  const {
    theme: { hostLivestreamStatusPanel },
  } = useTheme();

  return (
    <View
      style={[styles.container, hostLivestreamStatusPanel.container, style]}
    >
      <View style={[styles.leftElement, hostLivestreamStatusPanel.leftElement]}>
        <LiveIndicator isLive={liveOrBroadcasting} />
        <FollowerCount humanizeParticipantCount={humanizeFollowerCount} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  leftElement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightElement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
