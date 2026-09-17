import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { LivestreamAudioControlButton } from './LivestreamAudioControlButton';
import { LivestreamVideoControlButton } from './LivestreamVideoControlButton';
import { CallControlsButton } from '../../Call/CallControls';
import { ControlButtonIcon, MoreVert } from '../../../icons';

/**
 * Props for the LivestreamMediaControls component.
 */
export type LivestreamMediaControlsProps = {
  onMorePress?: () => void;
};

/**
 * The LivestreamMediaControls component controls the media publish/unpublish for the host's live stream.
 */
export const LivestreamMediaControls = ({
  onMorePress,
}: LivestreamMediaControlsProps) => {
  const {
    theme: { livestreamMediaControls },
  } = useTheme();
  return (
    <View style={[styles.container, livestreamMediaControls.container]}>
      {onMorePress && (
        <CallControlsButton onPress={onMorePress}>
          <ControlButtonIcon icon={MoreVert} />
        </CallControlsButton>
      )}
      <LivestreamAudioControlButton />
      <LivestreamVideoControlButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
