import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { TopViewBackground } from '@stream-io/video-react-native-sdk/src/icons';
import { CallingState } from '@stream-io/video-client';
import { HangUpCallButton } from '@stream-io/video-react-native-sdk/src/components/Call';
import {
  colors,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk/src';
import { useTheme } from '@stream-io/video-react-native-sdk';
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
};

export const CustomCallTopView = ({
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
  const [inProgress, setInProgress] = useState(false);

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
          <HangUpCallButton onPressHandler={onHangupCallHandler} />
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
        container: {},
        content: {
          position: 'absolute',
          backgroundColor: theme.colors.sheetPrimary,
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
    [theme],
  );
};
