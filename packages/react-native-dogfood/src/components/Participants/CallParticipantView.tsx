import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type SizeType = 'small' | 'medium' | 'large' | 'xl';
type CallParticipantViewProps = {
  size: SizeType;
};

const CallParticipantView = ({ size }: CallParticipantViewProps) => {
  return (
    <View style={{ ...styles.containerBase, ...styles[`${size}Container`] }}>
      <Text>CallParticipantView {size}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    borderColor: 'red',
    borderWidth: 2,
  },
  smallContainer: {
    backgroundColor: 'gray',
    flexBasis: '33.33%',
    width: '50%',
  },
  mediumContainer: {
    backgroundColor: 'pink',
    flexBasis: '50%',
    width: '50%',
  },
  largeContainer: {
    backgroundColor: 'yellow',
  },
  xlContainer: {
    backgroundColor: 'green',
  },
});
export default CallParticipantView;
