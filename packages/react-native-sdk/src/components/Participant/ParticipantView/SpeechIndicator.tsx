import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';

/**
 * Props for the SpeechIndicator component.
 */
export type SpeechIndicatorProps = {
  /**
   * Indicates whether the participant is speaking.
   * If true, the animation will run, otherwise the bars will remain static.
   */
  isSpeaking: boolean;
};

/**
 * The SpeechIndicator component displays animated bars to indicate speech activity.
 * The bars animate when `isSpeaking` is true, mimicking a sound meter.
 */
export const SpeechIndicator = ({ isSpeaking }: SpeechIndicatorProps) => {
  const styles = useStyles();

  const [animationValues] = useState(() => [
    new Animated.Value(0.6),
    new Animated.Value(0.6),
    new Animated.Value(0.6),
  ]);

  useEffect(() => {
    if (isSpeaking) {
      animationValues.forEach((animatedValue, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: index % 2 === 0 ? 0.3 : 1.1,
              duration: (index + 1) * 300,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.6,
              duration: (index + 1) * 300,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });
    } else {
      animationValues.forEach((animatedValue) => {
        animatedValue.setValue(0.3); // Set a smaller value for a reduced default height
      });
    }
  }, [isSpeaking, animationValues]);

  const barStyle = (animatedValue: Animated.Value) => ({
    transform: [{ scaleY: animatedValue }],
  });

  return (
    <View style={[styles.container]}>
      {animationValues.map((animatedValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            isSpeaking ? barStyle(animatedValue) : styles.smallBar, // Apply smaller bar style when not speaking
          ]}
        />
      ))}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: theme.variants.roundButtonSizes.sm,
          width: theme.variants.roundButtonSizes.sm,
          borderRadius: 5,
          gap: 1,
          backgroundColor: theme.colors.sheetOverlay,
          padding: 5,
        },
        smallBar: {
          height: '30%', // Smaller default height when animation is not running
        },
        bar: {
          width: 3,
          height: '100%',
          backgroundColor: theme.colors.iconSecondary,
          borderRadius: 2,
        },
      }),
    [theme],
  );
};

export default SpeechIndicator;
