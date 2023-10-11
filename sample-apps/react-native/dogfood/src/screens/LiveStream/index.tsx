import { useI18n } from '@stream-io/video-react-native-sdk';
import React from 'react';
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

  const onHostViewSelect = () => {
    navigation.navigate('JoinLiveStream', { mode: 'host' });
  };

  const onViewerViewSelect = () => {
    navigation.navigate('JoinLiveStream', { mode: 'viewer' });
  };

  const landScapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  return (
    <View style={[styles.container, landScapeStyles]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    backgroundColor: appTheme.colors.static_grey,
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
    color: appTheme.colors.static_white,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: appTheme.spacing.lg,
  },
  subTitle: {
    color: appTheme.colors.light_gray,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: appTheme.spacing.xl,
  },
});
