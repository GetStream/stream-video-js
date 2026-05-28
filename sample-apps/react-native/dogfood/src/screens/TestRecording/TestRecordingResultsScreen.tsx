import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Share from 'react-native-share';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TestRecordingStackParamList } from '../../../types';
import { appTheme } from '../../theme';
import { useAppGlobalStoreSetState } from '../../contexts/AppContext';
import { PlaybackPanel } from './components';

type Props = NativeStackScreenProps<
  TestRecordingStackParamList,
  'TestRecordingResults'
>;

export const TestRecordingResultsScreen = ({ navigation, route }: Props) => {
  const styles = useStyles();
  const appSet = useAppGlobalStoreSetState();
  const { uri } = route.params;

  const handleShare = () => {
    Share.open({
      url: uri,
      type: 'video/mp4',
      failOnCancel: false,
    }).catch(() => {});
  };

  const handleRecordAgain = () => {
    navigation.replace('TestRecordingScreen');
  };

  const handleDone = () => {
    appSet({ appMode: 'None' });
  };

  return (
    <View style={styles.container}>
      <PlaybackPanel uri={uri} />
      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Share</Text>
        </Pressable>
        <Pressable
          onPress={handleRecordAgain}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Record again</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={handleDone}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Done</Text>
      </Pressable>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: appTheme.spacing.md,
          gap: appTheme.spacing.md,
          backgroundColor: theme.colors.sheetPrimary,
        },
        actionsRow: {
          flexDirection: 'row',
          gap: appTheme.spacing.sm,
        },
        primaryButton: {
          flex: 1,
          backgroundColor: appTheme.colors.primary,
          borderRadius: 8,
          paddingVertical: appTheme.spacing.lg,
          justifyContent: 'center',
          alignItems: 'center',
        },
        secondaryButton: {
          backgroundColor: 'transparent',
          borderRadius: 8,
          paddingVertical: appTheme.spacing.md,
          justifyContent: 'center',
          alignItems: 'center',
        },
        secondaryButtonText: {
          color: theme.colors.textSecondary,
          fontWeight: '500',
          fontSize: 14,
        },
        buttonPressed: {
          opacity: 0.8,
        },
        buttonText: {
          color: appTheme.colors.static_white,
          fontWeight: '600',
          fontSize: 14,
        },
      }),
    [theme],
  );
};
