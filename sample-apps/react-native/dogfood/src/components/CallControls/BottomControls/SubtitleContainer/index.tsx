import { View, StyleSheet } from 'react-native';
import { ClosedCaptions } from './ClosedCaptions';
import { SpeakingLabel } from './SpeakingLabel';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

// speaking while muted and caption controls - aka subtitle on top of video
export const SubtitleContainer = ({
  controlsContainerHeight,
}: {
  controlsContainerHeight: number;
}) => {
  return (
    <View style={[styles.container, { bottom: controlsContainerHeight }]}>
      <ClosedCaptions />
      <SpeakingLabel />
    </View>
  );
};
