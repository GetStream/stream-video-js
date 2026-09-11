import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { useI18n, useTheme } from '@stream-io/video-react-native-sdk';

type Props = {
  title: string;
  message: string;
  returnToHomeHandler: () => void;
  backToLobbyHandler: () => void;
};

export const CallErrorComponent = ({
  title,
  message,
  returnToHomeHandler,
  backToLobbyHandler,
}: Props) => {
  const { t } = useI18n();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.errorHeading}>{title}</Text>
      <Text style={styles.errorText}>{message}</Text>
      <Button title={t('Return to Home')} onPress={returnToHomeHandler} />
      <Button
        title={t('Back to Lobby')}
        onPress={backToLobbyHandler}
        buttonStyle={styles.backToLobbyButton}
      />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          backgroundColor: semantics.backgroundCoreApp,
          padding: primitives.spacingMd,
        },
        wrapper: {
          flex: 1,
          backgroundColor: semantics.backgroundCoreApp,
        },
        errorHeading: {
          fontSize: 30,
          color: semantics.textPrimary,
          textAlign: 'center',
        },
        errorText: {
          fontSize: 15,
          color: semantics.textPrimary,
          textAlign: 'center',
          marginVertical: primitives.spacingMd,
        },
        backToLobbyButton: {
          marginTop: primitives.spacingLg,
        },
      }),
    [primitives, semantics],
  );
};
