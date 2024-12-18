import { useI18n, useTheme } from '@stream-io/video-react-native-sdk';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Button } from '../../components/Button';
import { appTheme } from '../../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { useOrientation } from '../../hooks/useOrientation';

type LiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'LiveStreamChoose'
>;

export const LiveStreamChooseScreen = ({
  navigation,
}: LiveStreamScreenProps) => {
  const { t } = useI18n();
  const orientation = useOrientation();
  const styles = useStyles();

  const onHostViewSelect = () => {
    navigation.navigate('JoinLiveStream', { mode: 'host' });
  };

  const onViewerViewSelect = () => {
    navigation.navigate('JoinLiveStream', { mode: 'viewer' });
  };

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  return (
    <View style={[styles.container, landscapeStyles]}>
      <View style={styles.topContainer}>
        <Image source={require('../../assets/Logo.png')} style={styles.logo} />
        <View>
          <Text style={styles.title}>{t('Stream Live stream App')}</Text>
          <Text style={styles.subTitle}>{t('Choose the Mode')}</Text>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <View>
          <Button title={t('Hosts')} onPress={onHostViewSelect} />
          <Button
            title={t('Viewers')}
            onPress={onViewerViewSelect}
            buttonStyle={styles.viewerButton}
          />
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
          flex: 1,
          justifyContent: 'space-evenly',
          backgroundColor: theme.colors.sheetPrimary,
          padding: appTheme.spacing.lg,
        },
        topContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        viewerButton: {
          marginTop: appTheme.spacing.md,
        },
        logo: {
          height: 100,
          width: 100,
          borderRadius: 20,
          alignSelf: 'center',
        },
        bottomContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        title: {
          fontSize: 30,
          color: theme.colors.textPrimary,
          fontWeight: '500',
          textAlign: 'center',
          marginTop: appTheme.spacing.lg,
        },
        subTitle: {
          color: theme.colors.textSecondary,
          fontSize: 16,
          textAlign: 'center',
          marginHorizontal: appTheme.spacing.xl,
        },
      }),
    [theme],
  );
};
