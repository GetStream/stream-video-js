import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { ControlButtonIcon, Maximize } from '../../../icons';
import { VolumeOff, VolumeOn } from '../../../icons/LivestreamControls';
import { useTheme } from '../../../contexts';
import { callManager } from '../../../modules/call-manager';
import { FollowerCount, LiveIndicator } from '..';
import { CallControlsButton } from '../../Call';

export type ViewerStatusPanelProps = {
  humanizeFollowerCount?: boolean;
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

export const ViewerStatusPanel = ({
  humanizeFollowerCount = true,
  showControls,
  setShowControls,
  style,
}: ViewerStatusPanelProps) => {
  const { useIsCallLive, useIsCallHLSBroadcastingInProgress } =
    useCallStateHooks();
  const isCallLive = useIsCallLive();
  const isBroadcasting = useIsCallHLSBroadcastingInProgress();
  const liveOrBroadcasting = isCallLive || isBroadcasting;

  const [isMuted, setIsMuted] = useState(false);

  const {
    theme: { viewerLivestreamStatusPanel },
  } = useTheme();

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const toggleAudio = () => {
    const shouldMute = !isMuted;
    callManager.speaker.setMute(shouldMute);
    setIsMuted(shouldMute);
  };

  if (!showControls) {
    return null;
  }

  return (
    <View
      style={[styles.container, viewerLivestreamStatusPanel.container, style]}
    >
      <View
        style={[styles.leftElement, viewerLivestreamStatusPanel.leftElement]}
      >
        <LiveIndicator isLive={liveOrBroadcasting} />
        <FollowerCount humanizeParticipantCount={humanizeFollowerCount} />
      </View>

      <View
        style={[styles.rightElement, viewerLivestreamStatusPanel.rightElement]}
      >
        <CallControlsButton
          style={viewerLivestreamStatusPanel.button}
          onPress={toggleAudio}
        >
          <ControlButtonIcon icon={isMuted ? VolumeOff : VolumeOn} />
        </CallControlsButton>

        <CallControlsButton
          style={viewerLivestreamStatusPanel.button}
          onPress={toggleControls}
        >
          <ControlButtonIcon icon={Maximize} />
        </CallControlsButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
