import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';

export const ChooseAppModeScreen = () => {
  const setState = useAppGlobalStoreSetState();

  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
  };

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Logo.png')} style={styles.logo} />
      <View>
        <Text style={styles.title}>Stream DogFood App</Text>
        <Text style={styles.subTitle}>Choose the Mode</Text>
      </View>
      <View>
        <Button title="Meeting" onPress={onMeetingSelect} />
        <Button
          title="Call"
          onPress={onRingingSelect}
          buttonStyle={styles.callButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-evenly',
    backgroundColor: appTheme.colors.static_grey,
    padding: appTheme.spacing.lg,
  },
  callButton: {
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
