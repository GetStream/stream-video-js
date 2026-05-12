import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TestRecordingStackParamList } from '../../types';
import { TestRecordingScreen } from '../screens/TestRecording/TestRecordingScreen';
import { NavigationHeader } from '../components/NavigationHeader';

const TestRecordingStack =
  createNativeStackNavigator<TestRecordingStackParamList>();

export const TestRecording = () => {
  return (
    <TestRecordingStack.Navigator>
      <TestRecordingStack.Screen
        name="TestRecordingScreen"
        component={TestRecordingScreen}
        options={{ header: NavigationHeader }}
      />
    </TestRecordingStack.Navigator>
  );
};
