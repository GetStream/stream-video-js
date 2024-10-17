import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallDuration } from '../../assets/CallDuration';
import { RecordCall } from '@stream-io/video-react-native-sdk/src/icons/RecordCall';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { useTheme } from '@stream-io/video-react-native-sdk';

export const DurationBadge = (props: any) => {
  const {
    theme: {
      colors,
      variants: { iconSizes },
    },
  } = useTheme();
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);
  const styles = useStyles(props);

  // Format duration to MM:SS
  const minutes = Math.floor(duration / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (duration % 60).toString().padStart(2, '0');
  const timestamp = `${minutes}:${seconds}`;
  const text = props.inProgress ? 'Recording in progress...' : timestamp;
  const icon = true ? (
    <CallDuration color={colors.iconAlertSuccess} size={iconSizes.md} />
  ) : (
    <RecordCall color={colors.iconAlertWarning} size={iconSizes.md} />
  );

  return (
    <View style={styles.container}>
      <IconWrapper>
        <View style={styles.icon}>{icon}</View>
      </IconWrapper>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const useStyles = (props: any) => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.buttonSecondaryDefault,
          borderRadius: 8,
          flexDirection: 'row',
          height: 36,
          paddingLeft: 17,
          paddingRight: 5,
          justifyContent: 'center',
          alignItems: 'center',
          width: props.inProgress ? 200 : 80,
        },
        text: {
          color: theme.colors.typePrimary,
          fontSize: 13,
          fontWeight: '600',
          flexShrink: 0,
          marginLeft: 10,
          minWidth: 41,
        },
        icon: {
          marginTop: 2,
          marginRight: 5,
        },
      }),
    [theme],
  );
};
