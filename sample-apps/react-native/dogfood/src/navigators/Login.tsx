import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { LoginStackParamList } from '../../types';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { prontoCallId$ } from '../hooks/useProntoLinkEffect';
import { ChooseFlowScreen } from '../screens/ChooseFlowScreen';
import LoginScreen from '../screens/LoginScreen';

const LoginStack = createNativeStackNavigator<LoginStackParamList>();

export const Login = () => {
  const setState = useAppGlobalStoreSetState();
  const loginNavigation =
    useNavigation<NativeStackNavigationProp<LoginStackParamList>>();
  React.useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({ appMode: 'Meeting' });
        loginNavigation.navigate('LoginScreen');
      }
    });
    return () => subscription.unsubscribe();
  }, [setState, loginNavigation]);
  return (
    <LoginStack.Navigator>
      <LoginStack.Screen
        name="ChooseFlowScreen"
        component={ChooseFlowScreen}
        options={{ headerShown: false }}
      />
      <LoginStack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </LoginStack.Navigator>
  );
};
