import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../types';
import JoinMeetingScreen from '../screens/Meeting/JoinMeetingScreen';
import { NavigationHeader } from '../components/NavigationHeader';
import { MeetingScreen } from '../screens/Meeting/MeetingScreen';
import { GuestModeScreen } from '../screens/Meeting/GuestModeScreen';
import { GuestMeetingScreen } from '../screens/Meeting/GuestMeetingScreen';

const MeetingStack = createNativeStackNavigator<MeetingStackParamList>();

export const Meeting = () => {
  return (
    <MeetingStack.Navigator>
      <MeetingStack.Screen
        name="JoinMeetingScreen"
        component={JoinMeetingScreen}
        options={{ header: NavigationHeader }}
      />
      <MeetingStack.Screen
        name="MeetingScreen"
        component={MeetingScreen}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="GuestModeScreen"
        component={GuestModeScreen}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="GuestMeetingScreen"
        component={GuestMeetingScreen}
        options={{ headerShown: false }}
      />
    </MeetingStack.Navigator>
  );
};
