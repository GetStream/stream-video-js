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
import { TopLeftControls } from './TopLeftControls';

export type CallTopViewProps = {
  /**
   * Handler to be called when the hangup button is pressed in the CallTopView.
   * @returns void
   */
  onHangupCallHandler?: () => void;
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
  onHangupCallHandler,
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
  const [inProgress, setInProgress] = useState(true);

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const { height, width } = event.nativeEvent.layout;
    if (setCallTopViewHeight) {
      setCallTopViewHeight(height);
      setCallTopViewWidth(width);
    }
  };

  return (
    <View style={[styles.container, styleProp, callTopView.container]}>
      {/* Component for the background of the CallTopView. Since it has a Linear Gradient, an SVG is used to render it. */}
      <TopViewBackground height={callTopViewHeight} width={callTopViewWidth} />
      <View style={[styles.content, callTopView.content]} onLayout={onLayout}>
        <View style={styles.leftElement}>
          <TopLeftControls inProgress={inProgress} />
        </View>
        <View style={[styles.centerElement, callTopView.centerElement]}>
          <View style={styles.centerWrapper}>
            <DurationBadge inProgress={inProgress} />
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
        container: {
          // borderWidth: 2,
          // borderColor: 'red',
        },
        content: {
          position: 'absolute',
          backgroundColor: 'black',
          top: 0,
          flexDirection: 'row',
          paddingTop: 2,
          paddingBottom: 2,
          paddingRight: 12,
          paddingLeft: 12,
          alignItems: 'center',
          // borderWidth: 2,
          // borderColor: 'red',
        },
        leftElement: {
          flex: 1,
          alignItems: 'flex-start',
          // borderWidth: 2,
          // borderColor: 'red',
        },
        centerElement: {
          flex: 1,
          alignItems: 'center',
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
