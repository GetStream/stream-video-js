import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { appTheme } from '../theme';

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
  return (
    <View style={styles.container}>
      <Text style={styles.errorHeading}>{title}</Text>
      <Text style={styles.errorText}>{message}</Text>
      <Button title="Return to Home" onPress={returnToHomeHandler} />
      <Button
        title="Back to Lobby"
        onPress={backToLobbyHandler}
        buttonStyle={styles.backToLobbyButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: appTheme.colors.static_grey,
    padding: appTheme.spacing.lg,
  },
  wrapper: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  errorHeading: {
    fontSize: 30,
    color: appTheme.colors.static_white,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: appTheme.colors.error,
    textAlign: 'center',
    marginVertical: appTheme.spacing.md,
  },
  backToLobbyButton: {
    marginTop: appTheme.spacing.lg,
  },
});
