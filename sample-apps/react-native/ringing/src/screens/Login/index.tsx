import { Text, View } from 'react-native';

export const Login = () => {
  return (
    <View style={styles.container}>
      <Text>What's your User ID?</Text>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
};
