import { useI18n } from '@stream-io/video-react-native-sdk';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { appTheme } from '../../theme';

type LobbyProps = {
  autoJoin: boolean;
  isLive: boolean;
  setAutoJoin: (join: boolean) => void;
};

export const ViewerLobby = ({ autoJoin, isLive, setAutoJoin }: LobbyProps) => {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      {!isLive && <ActivityIndicator style={styles.activityIndicator} />}
      <Text style={styles.text}>
        {isLive
          ? t('Stream is ready!')
          : t('Waiting for the livestream to start')}
      </Text>
      <View style={styles.switchView}>
        <Switch
          value={autoJoin}
          onValueChange={(value: boolean) => setAutoJoin(value)}
        />
        <Text style={styles.switchText}>
          {t('Join automatically, when stream is ready')}
        </Text>
      </View>
      <Button
        disabled={!isLive}
        onPress={() => setAutoJoin(true)}
        title={t('Join Stream')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.colors.static_grey,
    padding: 16,
  },
  text: {
    color: appTheme.colors.static_white,
    fontSize: 32,
  },
  activityIndicator: {
    marginBottom: 20,
  },
  switchView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchText: {
    marginLeft: 8,
    color: appTheme.colors.static_white,
  },
});
