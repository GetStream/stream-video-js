import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Back } from '../../../icons/Back';

export type TextBasedIndicatorProps = {
  text: string;
  onBackPress?: () => void;
};

export const TextBasedIndicator = (props: TextBasedIndicatorProps) => {
  const {
    theme: {
      colors,
      typefaces,
      variants: { iconSizes },
    },
  } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.base3 }]}>
      {props.onBackPress && (
        <View style={styles.backContainer}>
          <Pressable
            onPress={props.onBackPress}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.2 : 1,
                height: iconSizes.md,
                width: iconSizes.md,
              },
            ]}
          >
            <Back color={colors.base1} />
          </Pressable>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text
          style={[styles.text, { color: colors.base1 }, typefaces.heading6]}
        >
          {props.text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 24,
  },
});
