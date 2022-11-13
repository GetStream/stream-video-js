import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActiveCallScreen from './src/screens/ActiveCall';
import { AppGlobalContextProvider } from './src/contexts/AppContext';
import { RootStackParamList } from './types';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationHeader } from './src/components/NavigationHeader';
import { HomeScreen } from './src/screens/HomeScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import { LogBox } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

LogBox.ignoreAllLogs();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: NavigationHeader,
      }}
    >
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ActiveCall" component={ActiveCallScreen} />
      <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AppGlobalContextProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </AppGlobalContextProvider>
  );
}
