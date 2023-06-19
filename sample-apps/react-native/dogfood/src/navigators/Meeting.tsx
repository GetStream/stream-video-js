import React, { useEffect } from 'react';
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../types';
import JoinMeetingScreen from '../screens/Meeting/JoinMeetingScreen';
import { NavigationHeader } from '../components/NavigationHeader';
import { MeetingScreen } from '../screens/Meeting/MeetingScreen';
import { GuestModeScreen } from '../screens/Meeting/GuestModeScreen';
import { GuestMeetingScreen } from '../screens/Meeting/GuestMeetingScreen';
import { useNavigation } from '@react-navigation/native';
import { prontoCallId$ } from '../hooks/useProntoLinkEffect';

const MeetingStack = createNativeStackNavigator<MeetingStackParamList>();

export const Meeting = () => {
  const meetingNavigation =
    useNavigation<NativeStackNavigationProp<MeetingStackParamList>>();

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        meetingNavigation.navigate('MeetingScreen', { callId: prontoCallId });
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
      }
    });

    return () => subscription.unsubscribe();
  }, [meetingNavigation]);

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
