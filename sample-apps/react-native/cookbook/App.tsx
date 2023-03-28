import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CustomParticipantsLayoutScreen from './src/recipes/custom-participants-layout/CustomParticipantsLayoutScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName={'WelcomeScreen'}>
      <Stack.Screen
        name="WelcomeScreen"
        component={WelcomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CustomParticipantsLayoutScreen"
        component={CustomParticipantsLayoutScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default () => {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};
