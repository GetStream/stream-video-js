import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  ParticipantsInfoBadge as DefaultParticipantsInfoBadge,
  ParticipantsInfoBadgeProps,
} from './ParticipantsInfoBadge';
import { Back } from '../../../icons/Back';
import { TopViewBackground } from '../../../icons';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { useTheme } from '../../../contexts/ThemeContext';

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
  /**
   * Component to customize the ParticipantInfoBadge of the CallTopView.
   */
  ParticipantsInfoBadge?: React.ComponentType<ParticipantsInfoBadgeProps> | null;
};

export const CallTopView = ({
  onBackPressed,
  onParticipantInfoPress,
  title,
  style: styleProp,
  ParticipantsInfoBadge = DefaultParticipantsInfoBadge,
}: CallTopViewProps) => {
  const [callTopViewHeight, setCallTopViewHeight] = useState<number>(0);
  const {
    theme: {
      colors,
      typefaces,
      variants: { iconSizes },
      callTopView,
    },
  } = useTheme();
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
    <View style={[styleProp, callTopView.container]}>
      {/* Component for the background of the CallTopView. Since it has a Linear Gradient, an SVG is used to render it. */}
      <TopViewBackground height={callTopViewHeight} width={'100%'} />
      <View style={[styles.content, callTopView.content]} onLayout={onLayout}>
        <View style={styles.leftElement}>
          {onBackPressed && (
            <Pressable
              style={({ pressed }) => [
                styles.backIconContainer,
                {
                  opacity: pressed ? 0.2 : 1,
                  height: iconSizes.md,
                  width: iconSizes.md,
                },
                callTopView.backIconContainer,
              ]}
              onPress={onBackPressed}
            >
              <Back color={colors.static_white} />
            </Pressable>
          )}
        </View>
        <View style={[styles.centerElement, callTopView.centerElement]}>
          {title ? (
            <Text
              style={[
                { color: colors.static_white },
                typefaces.subtitleBold,
                callTopView.title,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : (
            isCallReconnecting && (
              <Text
                style={[
                  { color: colors.static_white },
                  typefaces.subtitleBold,
                  callTopView.title,
                ]}
              >
                {t('Reconnecting...')}
              </Text>
            )
          )}
        </View>
        <View style={[styles.rightElement, callTopView.rightElement]}>
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
  content: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: 'center',
  },
  backIconContainer: {
    // Added to compensate the participant badge surface area
    marginLeft: 8,
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
});
