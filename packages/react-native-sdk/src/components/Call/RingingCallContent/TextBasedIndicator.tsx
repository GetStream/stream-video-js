import React from 'react';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../../contexts';
import { Back } from '../../../icons';

export type TextBasedIndicatorProps = {
  /**
   * The message shown in the middle of the screen.
   */
  text: string;
  /**
   * Shows a back button when provided. Without it the screen has no way out,
   * which matters for states the call may sit in indefinitely.
   */
  onBackPress?: () => void;

  style?: StyleProp<ViewStyle>;
};

/**
 * A full-screen message with an optional back button, shared by the ringing
 * flow's terminal and preparatory states.
 */
export const TextBasedIndicator = ({
  text,
  onBackPress,
  style,
}: TextBasedIndicatorProps) => {
  const styles = useStyles();

  return (
    <View style={[styles.container, style]}>
      {onBackPress && (
        <View style={styles.backContainer}>
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [
              styles.buttonContainer,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Back size={styles.icon.width} color={styles.icon.color} />
          </Pressable>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { foundations, components, semantics },
  } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: semantics.backgroundCoreApp,
    },
    buttonContainer: {
      height: components.iconSizeMd,
      width: components.iconSizeMd,
    },
    icon: {
      width: components.iconSizeMd,
      color: semantics.accentNeutral,
    },
    backContainer: {
      padding: 8,
      paddingTop: 16,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: semantics.textPrimary,
      fontSize: foundations.typography.fontSizeSize22,
    },
  });
};
