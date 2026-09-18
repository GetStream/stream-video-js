import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Share from 'react-native-share';
import { Button, useTheme } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TestRecordingStackParamList } from '../../../types';
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
        <Button style={styles.button} onPress={handleShare} text={'Share'} />
        <Button
          style={styles.button}
          onPress={handleRecordAgain}
          text={'Record again'}
        />
      </View>
      <Button onPress={handleDone} text={'Done'} type={'secondary'} />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics, insets },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacingMd,
          paddingBottom: primitives.spacingMd + insets.bottom,
          gap: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreApp,
        },
        actionsRow: {
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          gap: primitives.spacingSm,
        },
        button: {
          flex: 1,
        },
      }),
    [primitives, semantics, insets],
  );
};
