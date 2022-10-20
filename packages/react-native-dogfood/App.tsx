import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/Home';
import ActiveCallScreen from './src/screens/ActiveCall';
import { AppGlobalContextProvider } from './src/contexts/AppContext';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppGlobalContextProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ActiveCall" component={ActiveCallScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppGlobalContextProvider>
  );
}
