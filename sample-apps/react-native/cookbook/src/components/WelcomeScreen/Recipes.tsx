/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import {Pressable, StyleSheet, Text, View} from 'react-native';
// @ts-ignore
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../types';

type Recipe = {
  id: number;
  title: string;
  description: string;
  linkToDocs: string;
  screenName: keyof RootStackParamList;
};
const recipes: Recipe[] = [
  {
    id: 1,
    title: 'Custom Participants List layout',
    description:
      "Build your own call participant's grid with a custom behaviour",
    linkToDocs:
      'http://localhost:3000/chat/docs/sdk/reactnative/ui-cookbook/01-ui-cookbooks-overview/',
    screenName: 'CustomParticipantsLayoutScreen',
  },
];

export default () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      {recipes.map(
        ({id, title, linkToDocs, screenName, description}, index) => (
          <View key={id} style={styles.recipeContainer}>
            <View style={styles.details}>
              <Text style={styles.recipeTitle}>
                {index + 1}. {title}
              </Text>
              <Text style={styles.recipeDescription}>{description}</Text>
            </View>
            <View style={styles.recipePressablesContainer}>
              <Pressable
                style={styles.pressableContainer}
                onPress={() => openURLInBrowser(linkToDocs)}>
                <Text style={styles.pressableText}>
                  📒 Open Recipe in Browser
                </Text>
              </Pressable>
              <Pressable
                style={styles.pressableContainer}
                onPress={() => navigation.navigate(screenName)}>
                <Text style={styles.pressableText}>
                  📲 Check Final Implementation
                </Text>
              </Pressable>
            </View>
          </View>
        ),
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 32,
    paddingHorizontal: 24,
  },
  recipeContainer: {
    borderTopColor: '#000',
    borderTopWidth: 2,
    paddingVertical: 16,
  },
  details: {
    marginBottom: 24,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  recipeDescription: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '400',
  },
  linkWrapper: {
    flex: 2,
    marginRight: 4,
  },
  recipePressablesContainer: {
    // flex: 1,
  },
  pressableContainer: {
    backgroundColor: '#000',
    padding: 8,
    marginBottom: 4,
  },
  pressableText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
