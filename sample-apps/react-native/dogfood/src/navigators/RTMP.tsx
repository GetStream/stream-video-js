import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RTMPParamList } from '../../types';
import { RTMPBroadcastScreen } from '../screens/RTMPBroadcastScreen';

const RTMPStack = createNativeStackNavigator<RTMPParamList>();

export const RTMP = () => {
  return (
    <RTMPStack.Navigator>
      <RTMPStack.Screen
        name="RTMPBroadcast"
        component={RTMPBroadcastScreen}
        options={{ headerShown: false }}
      />
    </RTMPStack.Navigator>
  );
};
