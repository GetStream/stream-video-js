import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';

const styles = StyleSheet.create({
  tabBarContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginHorizontal: 10,
    backgroundColor: '#DEDEDE',
    padding: 2,
    borderRadius: 5,
    height: 40,
    alignItems: 'center',
  },
  tab: {
    width: '50%',
    borderRadius: 5,
  },
  selectedTab: {
    backgroundColor: 'white',
    padding: 9,
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
