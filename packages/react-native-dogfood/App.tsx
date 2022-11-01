import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MeetingHomeScreen from './src/screens/Meeting/MeetingHome';
import ActiveCallScreen from './src/screens/Meeting/ActiveCall';
import { AppGlobalContextProvider } from './src/contexts/AppContext';
import { RootStackParamList } from './types';
import RingingHomeScrren from './src/screens/Ringing/RingingHome';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppGlobalContextProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HomeScreen"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="MeetingHome" component={MeetingHomeScreen} />
          <Stack.Screen name="ActiveCall" component={ActiveCallScreen} />
          <Stack.Screen name="RingingHome" component={RingingHomeScrren} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppGlobalContextProvider>
  );
}
