import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts';
import { Back } from '../../../icons';

export type CallLeftIndicatorProps = {
  onBackPress?: () => void;
};

export const CallLeftIndicator = (props: CallLeftIndicatorProps) => {
  const { t } = useI18n();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {props.onBackPress && (
        <View style={styles.backContainer}>
          <Pressable
            onPress={props.onBackPress}
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
        <Text style={styles.text}>{t('You have left the call')}</Text>
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { foundations, components, semantics, insets },
  } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: semantics.backgroundCoreApp,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
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
