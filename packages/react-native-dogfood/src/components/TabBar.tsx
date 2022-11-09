import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    backgroundColor: '#DEDEDE',
    padding: 2,
    borderRadius: 5,
    height: 46,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: 5,
  },
  selectedTab: {
    backgroundColor: 'white',
  },
  tabText: {
    textAlign: 'center',
    color: 'black',
  },
  selectedText: {
    fontWeight: 'bold',
  },
});

export const TabBar = ({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <View style={styles.tabBarContainer}>
      <Pressable
        onPress={() => setSelectedTab('Meeting')}
        style={[
          styles.tab,
          selectedTab === 'Meeting' ? styles.selectedTab : null,
        ]}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === 'Meeting' ? styles.selectedText : null,
          ]}
        >
          Meeting
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.tab,
          selectedTab === 'Ringing' ? styles.selectedTab : null,
        ]}
        onPress={() => setSelectedTab('Ringing')}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === 'Ringing' ? styles.selectedText : null,
          ]}
        >
          Ringing
        </Text>
      </Pressable>
    </View>
  );
};
