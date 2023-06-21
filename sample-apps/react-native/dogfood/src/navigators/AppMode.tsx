import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppModeParamList } from '../../types';
import { ChooseAppModeScreen } from '../screens/ChooseAppModeScreen';
import { NavigationHeader } from '../components/NavigationHeader';

const AppModeStack = createNativeStackNavigator<AppModeParamList>();

export const AppMode = () => {
  return (
    <AppModeStack.Navigator>
      <AppModeStack.Screen
        name="ChooseAppModeScreen"
        component={ChooseAppModeScreen}
        options={{ header: NavigationHeader }}
      />
    </AppModeStack.Navigator>
  );
};
