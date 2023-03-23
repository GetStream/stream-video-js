/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {ImageBackground, StyleSheet, Text, useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const headerBanner = require('../../../assets/header-banner.jpg');

export default () => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <ImageBackground
      resizeMode="contain"
      source={headerBanner}
      style={[
        styles.background,
        {
          backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
        },
      ]}>
      <Text style={styles.text}>
        Welcome to
        {'\n'}
        Stream's Video Cookbook
      </Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    paddingVertical: 70,
  },
  text: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
});
