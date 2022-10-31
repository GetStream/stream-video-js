import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Button, SafeAreaView, StyleSheet } from 'react-native';
import { RootStackParamList } from '../../types';

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const HomeScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <Button
        title="Meeting"
        onPress={() => {
          navigation.navigate('Meeting');
        }}
      />
      <Button
        title="Ringing"
        color={'red'}
        onPress={() => {
          navigation.navigate('Ringing');
        }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
