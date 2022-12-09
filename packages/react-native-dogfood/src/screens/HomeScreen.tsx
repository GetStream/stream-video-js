import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { TabBar } from '../components/TabBar';
import Meeting from '../components/Meeting/Meeting';
import Ringing from '../components/Ringing/Ringing';
import { RootStackParamList } from '../../types';
import { useIncomingCalls } from '@stream-io/video-react-native-sdk';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

export const HomeScreen = ({ navigation, route }: Props) => {
  const [selectedTab, setSelectedTab] = useState('Meeting');
  const [loadingCall, setLoadingCall] = useState(false);
  const incomingCalls = useIncomingCalls();

  useEffect(() => {
    if (incomingCalls.length > 0) {
      navigation.navigate('IncomingCallScreen');
    }
  }, [incomingCalls, navigation]);

  return (
    <View style={styles.container}>
      {loadingCall ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={'large'} />
          <Text style={styles.loadingText}>Calling...</Text>
        </View>
      ) : (
        <>
          <TabBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          {selectedTab === 'Meeting' ? (
            <Meeting
              navigation={navigation}
              route={route}
              setLoadingCall={setLoadingCall}
            />
          ) : (
            <Ringing
              navigation={navigation}
              route={route}
              setLoadingCall={setLoadingCall}
            />
          )}
        </>
      )}
    </View>
  );
};
