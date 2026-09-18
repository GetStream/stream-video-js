import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  FollowerCount,
  LiveIndicator,
  useCallStateHooks,
  useTheme,
} from '../../..';

type HostStatusPanelProps = {
  humanizeFollowerCount?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const HostStatusPanel = ({
  humanizeFollowerCount = true,
  style,
}: HostStatusPanelProps) => {
  const { useIsCallLive, useIsCallHLSBroadcastingInProgress } =
    useCallStateHooks();
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
