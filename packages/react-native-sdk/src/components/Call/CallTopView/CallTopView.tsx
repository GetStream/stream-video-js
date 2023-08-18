import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { ParticipantsInfoBadgeProps } from './ParticipantsInfoBadge';
import { theme } from '../../../theme';
import { Back } from '../../../icons/Back';
import { Z_INDEX } from '../../../constants';
import { TopViewBackground } from '../../../icons';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';

export type CallTopViewProps = {
  /**
   * Height of the CallTopView.
   */
  callTopViewHeight?: number;
  /**
   * Set state function to set the height of CallTopView.
   */
  setCallTopViewHeight?: React.Dispatch<React.SetStateAction<number>>;
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
  /**
   * Component to customize the ParticipantInfoBadge of the CallTopView.
   */
  ParticipantsInfoBadge?: React.ComponentType<ParticipantsInfoBadgeProps>;
};

export const CallTopView = ({
  callTopViewHeight,
  setCallTopViewHeight,
  onBackPressed,
  onParticipantInfoPress,
  title,
  style,
  ParticipantsInfoBadge,
}: CallTopViewProps) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { t } = useI18n();
  const isCallReconnecting = callingState === CallingState.RECONNECTING;

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const { height } = event.nativeEvent.layout;
    if (setCallTopViewHeight) {
      setCallTopViewHeight(height);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Component for the background of the CallTopView. Since it has a Linear Gradient, an SVG is used to render it. */}
      <TopViewBackground height={callTopViewHeight} width={'100%'} />
      <View style={styles.topView} onLayout={onLayout}>
        <View style={styles.leftElement}>
          {onBackPressed && (
            <Pressable
              style={({ pressed }) => [
                theme.icon.md,
                styles.backIcon,
                { opacity: pressed ? 0.2 : 1 },
              ]}
              onPress={onBackPressed}
            >
              <Back color={theme.light.static_white} />
            </Pressable>
          )}
        </View>
        <View style={styles.centerElement}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            isCallReconnecting && (
              <Text style={styles.title}>{t('Reconnecting...')}</Text>
            )
          )}
        </View>
        <View style={styles.rightElement}>
          {ParticipantsInfoBadge && (
            <ParticipantsInfoBadge
              onParticipantInfoPress={onParticipantInfoPress}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: Z_INDEX.IN_FRONT,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topView: {
    position: 'absolute',
    flexDirection: 'row',
    paddingVertical: theme.padding.lg,
    alignItems: 'center',
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
