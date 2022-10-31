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

const MeetingScreenFlow = () => {
  return (
    <Stack.Navigator
      initialRouteName="MeetingHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MeetingHome" component={MeetingHomeScreen} />
      <Stack.Screen name="ActiveCall" component={ActiveCallScreen} />
    </Stack.Navigator>
  );
};

const RingingScreenFlow = () => {
  return (
    <Stack.Navigator
      initialRouteName="RingingHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="RingingHome" component={RingingHomeScrren} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AppGlobalContextProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HomeScreen"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="Meeting" component={MeetingScreenFlow} />
          <Stack.Screen name="Ringing" component={RingingScreenFlow} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppGlobalContextProvider>
  );
}
