import { useI18n } from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { appTheme } from '../../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';

type LiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'LiveStreamChoose'
>;

export const LiveStreamChooseScreen = ({
  navigation,
}: LiveStreamScreenProps) => {
  const { t } = useI18n();

  const onHostViewSelect = () => {
    navigation.navigate('JoinLiveStream', { mode: 'host' });
  };

  const onViewerViewSelect = () => {
    navigation.navigate('JoinLiveStream', { mode: 'viewer' });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/Logo.png')} style={styles.logo} />
      <View>
        <Text style={styles.title}>{t('Stream Live stream App')}</Text>
        <Text style={styles.subTitle}>{t('Choose the Mode')}</Text>
      </View>
      <View>
        <Button title={t('Hosts')} onPress={onHostViewSelect} />
        <Button
          title={t('Viewers')}
          onPress={onViewerViewSelect}
          buttonStyle={styles.viewerButton}
        />
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
  viewerButton: {
    marginTop: appTheme.spacing.md,
  },
  logo: {
    height: 100,
    width: 100,
    borderRadius: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 30,
    color: appTheme.colors.static_white,
    fontWeight: '500',
    textAlign: 'center',
  },
  subTitle: {
    color: appTheme.colors.light_gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: appTheme.spacing.lg,
    marginHorizontal: appTheme.spacing.xl,
  },
});
