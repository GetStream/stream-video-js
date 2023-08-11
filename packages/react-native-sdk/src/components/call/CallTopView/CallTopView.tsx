import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { ParticipantsInfoBadge } from './ParticipantsInfoBadge';
import { theme } from '../../../theme';
import { Back } from '../../../icons/Back';
import { Z_INDEX } from '../../../constants';
import { TopViewBackground } from '../../../icons';

export type CallTopViewProps = {
  /**
   * Handler to be called when the back button is pressed in the CallTopView.
   * @returns void
   */
  onBackPressed?: () => void;
  /**
   * Handler to be called when the Participant icon is pressed in the CallTopView.
   * @returns
   */
  onParticipantInfoPress?: () => void;
  /**
   * Title to be rendered at the center of the Header.
   */
  title?: string;
  /**
   * Style to override the container of the CallTopView.
   */
  style?: StyleProp<ViewStyle>;
};

export const CallTopView = ({
  onBackPressed,
  onParticipantInfoPress,
  title,
  style,
}: CallTopViewProps) => {
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  return (
    <>
      {/* Component for the background of the CallTopView. Since it has a Linear Gradient, an SVG is used to render it. */}
      <TopViewBackground
        height={headerHeight}
        width={'100%'}
        style={[styles.background, style]}
      />
      <View style={[styles.container, style]} onLayout={onLayout}>
        <View style={styles.leftElement}>
          {onBackPressed && (
            <Pressable style={[theme.icon.md, styles.backIcon]}>
              <Back color={theme.light.static_white} />
            </Pressable>
          )}
        </View>
        <View style={styles.centerElement}>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
        <View style={styles.rightElement}>
          {onParticipantInfoPress && (
            <ParticipantsInfoBadge
              onParticipantInfoPress={onParticipantInfoPress}
            />
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    zIndex: Z_INDEX.IN_FRONT,
  },
  container: {
    position: 'absolute',
    flexDirection: 'row',
    paddingVertical: theme.padding.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: Z_INDEX.IN_FRONT,
  },
  backIcon: {
    // Added to compensate the participant badge surface area
    marginLeft: theme.margin.sm,
  },
  leftElement: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerElement: {
    flex: 1,
    alignItems: 'center',
    flexGrow: 3,
  },
  rightElement: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    ...theme.fonts.subtitleBold,
    color: theme.light.static_white,
  },
});
