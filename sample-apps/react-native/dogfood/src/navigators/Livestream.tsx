import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../types';
import { LiveStreamChooseScreen } from '../screens/LiveStream';
import { HostLiveStreamScreen } from '../screens/LiveStream/HostLiveStream';
import { ViewLiveStreamScreen } from '../screens/LiveStream/ViewLiveStream';
import { NavigationHeader } from '../components/NavigationHeader';
import { JoinLiveStream } from '../screens/LiveStream/JoinLiveStream';

const LiveStreamStack = createNativeStackNavigator<LiveStreamParamList>();

export const LiveStream = () => {
  return (
    <LiveStreamStack.Navigator>
      <LiveStreamStack.Screen
        name="LiveStreamChoose"
        component={LiveStreamChooseScreen}
        options={{ header: NavigationHeader }}
      />
      <LiveStreamStack.Screen
        name="JoinLiveStream"
        component={JoinLiveStream}
        options={{ header: NavigationHeader }}
      />
      <LiveStreamStack.Screen
        name="HostLiveStream"
        component={HostLiveStreamScreen}
        options={{ headerShown: false }}
      />
      <LiveStreamStack.Screen
        name="ViewerLiveStream"
        component={ViewLiveStreamScreen}
        options={{ headerShown: false }}
      />
    </LiveStreamStack.Navigator>
  );
};
