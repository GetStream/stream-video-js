import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, useTheme } from '@stream-io/video-react-native-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

type Props = {
  title: string;
  message: string;
  returnToHomeHandler: () => void;
  /** Omit when the call this error belongs to must not be joined again. */
  backToLobbyHandler?: () => void;
};

export const CallErrorComponent = ({
  title,
  message,
  returnToHomeHandler,
  backToLobbyHandler,
}: Props) => {
  const { t } = useAppI18n();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.errorHeading}>{title}</Text>
      <Text style={styles.errorText}>{message}</Text>
      <Button
        text={t('callError.returnToHome.label', 'Return to Home')}
        onPress={returnToHomeHandler}
      />
      {backToLobbyHandler && (
        <Button
          text={t('callError.backToLobby.label', 'Back to Lobby')}
          onPress={backToLobbyHandler}
          style={styles.backToLobbyButton}
        />
      )}
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
