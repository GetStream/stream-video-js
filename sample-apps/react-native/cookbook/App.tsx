/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {Fragment} from 'react';
import {NavigationContainer} from '@react-navigation/native';

import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
// @ts-ignore
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';

const Header = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <ImageBackground
      accessibilityRole="image"
      testID="new-app-screen-header"
      source={{
        uri: 'https://getstream.imgix.net/images/cookbook-logo.png',
      }}
      style={[
        styles.background,
        {
          backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
        },
      ]}
      imageStyle={styles.logo}>
      <Text
        style={[
          styles.text,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        Welcome to
        {'\n'}
        Stream's Video Cookbook
      </Text>
    </ImageBackground>
  );
};

const links = [
  {
    id: 1,
    title: 'Custom Participants List layout',
    link: 'http://localhost:3000/chat/docs/sdk/reactnative/ui-cookbook/01-ui-cookbooks-overview/',
    description:
      "Build your own call participant's grid with a custom behaviour",
  },
];

const LearnMoreLinks = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.container}>
      {links.map(({id, title, link, description}) => (
        <Fragment key={id}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => openURLInBrowser(link)}
            style={styles.linkContainer}>
            <Text style={styles.link}>{title}</Text>
            <Text
              style={[
                styles.description,
                {
                  color: isDarkMode ? Colors.lighter : Colors.dark,
                },
              ]}>
              {description}
            </Text>
          </TouchableOpacity>
        </Fragment>
      ))}
    </View>
  );
};

const WelcomeScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <View style={styles.sectionContainer}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: isDarkMode ? Colors.white : Colors.black,
                },
              ]}>
              Table of contents
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                {
                  color: isDarkMode ? Colors.light : Colors.dark,
                },
              ]}>
              In the following sections, you will find a list of UI recipes that
              will help you build and personalize video app with Stream's RN and
              JS SDK.
            </Text>
          </View>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="WelcomeScreen"
        component={WelcomeScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  background: {
    paddingBottom: 40,
    paddingTop: 96,
    paddingHorizontal: 32,
  },
  logo: {
    opacity: 0.2,
    overflow: 'visible',
    resizeMode: 'cover',
    /*
     * These negative margins allow the image to be offset similarly across screen sizes and component sizes.
     *
     * The source logo.png image is 512x512px, so as such, these margins attempt to be relative to the
     * source image's size.
     */
    marginLeft: -128,
    marginBottom: -192,
  },
  text: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  linkContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    flex: 2,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.primary,
    marginRight: 4,
  },
  description: {
    flex: 3,
    paddingVertical: 8,
    fontSize: 14,
  },
});

export default () => {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};
