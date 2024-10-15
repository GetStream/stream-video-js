import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { ParticipantsInfoBadgeProps } from './ParticipantsInfoBadge';
import { Back } from '../../../icons/Back';
import { CallDuration, TopViewBackground } from '../../../icons';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { useTheme } from '../../../contexts/ThemeContext';
import { HangUpCallButton } from '..';
import { colors } from '../../..';
import { DurationBadge } from './DurationBadge';

export type CallTopViewProps = {
  /**
   * Handler to be called when the back button is pressed in the CallTopView.
   * @returns void
   */
  onBackPressed?: () => void;
  /**
   * Handler to be called when the hangup button is pressed in the CallTopView.
   * @returns void
   */
  onHangupCallHandler?: () => void;
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
  onHangupCallHandler,
  title = 'test',
  style: styleProp,
}: CallTopViewProps) => {
  const [callTopViewHeight, setCallTopViewHeight] = useState<number>(0);
  const [callTopViewWidth, setCallTopViewWidth] = useState<number>(0);
  const {
    theme: {
      colors,
      typefaces,
      variants: { iconSizes },
      callTopView,
    },
  } = useTheme();
  const styles = useStyles();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { t } = useI18n();
  const isCallReconnecting = callingState === CallingState.RECONNECTING;

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const { height, width } = event.nativeEvent.layout;
    if (setCallTopViewHeight) {
      setCallTopViewHeight(height);
      setCallTopViewWidth(width);
    }
  };

  return (
    <View style={[styleProp, callTopView.container]}>
      {/* Component for the background of the CallTopView. Since it has a Linear Gradient, an SVG is used to render it. */}
      <TopViewBackground height={callTopViewHeight} width={callTopViewWidth} />
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
              <Back color={colors.base1} />
            </Pressable>
          )}
        </View>
        <View style={[styles.centerElement, callTopView.centerElement]}>
          <View style={styles.centerWrapper}>
            <DurationBadge />
          </View>
        </View>
        <View style={styles.rightElement}>
          <HangUpCallButton onHangupCallHandler={onHangupCallHandler} />
        </View>
      </View>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
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
        centerWrapper: {
          backgroundColor: colors.buttonSecondaryDefault,
          borderRadius: 8,
          width: 60,
          display: 'flex',
          flexDirection: 'row',
          height: 32,
          padding: 6,
          justifyContent: 'center',
          alignItems: 'center',
          // gap: 4,
        },
        timer: {
          color: colors.typePrimary,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [theme]
  );
};
