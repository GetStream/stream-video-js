import { useI18n } from '@stream-io/video-react-native-sdk';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { appTheme } from '../../theme';

type LobbyProps = {
  isLive: boolean;
  handleJoinCall?: () => void;
  setCallJoined: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ViewerLobby = ({
  isLive,
  handleJoinCall,
  setCallJoined,
}: LobbyProps) => {
  const { t } = useI18n();
  useEffect(() => {
    setCallJoined(false);
  }, [setCallJoined]);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {isLive
          ? t('Stream is ready!')
          : t('Waiting for the livestream to start')}
      </Text>
      {!isLive && <ActivityIndicator style={styles.activityIndicator} />}
      <Button
        disabled={!isLive}
        onPress={handleJoinCall}
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
    fontSize: 20,
    margin: 20,
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
