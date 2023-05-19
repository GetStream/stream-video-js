/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppProvider, useAppContext} from './src/context/AppContext';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from './src/types';
import {UserList} from './src/components/UserList';
import {JoinMeetingScreen} from './src/screens/JoinMeetingScreen';
import {NavigationHeader} from './src/components/NavigationHeader';

import {MeetingScreen} from './src/screens/MeetingScreen';

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Root = () => {
  const {user} = useAppContext();
  if (!user) {
    return <UserList />;
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="JoinMeetingScreen"
        component={JoinMeetingScreen}
        options={{header: NavigationHeader}}
      />
      <Stack.Screen
        name="MeetingScreen"
        component={MeetingScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

function App(): JSX.Element {
  return (
    <NavigationContainer>
      <AppProvider>
        <Root />
      </AppProvider>
    </NavigationContainer>
  );
}

export default App;
