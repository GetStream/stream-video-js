import { type PressableProps, Pressable, StyleSheet, Text } from 'react-native';

type ActionButtonProps = PressableProps & {
  selectedUser: string | null;
  onPress: () => void;
  action: string;
};
export const ActionButton: React.FC<ActionButtonProps> = ({
  selectedUser,
  onPress,
  action,
  ...rest
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.loginButton,
        !selectedUser && styles.loginButtonDisabled,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
      disabled={selectedUser === null}
    >
      <Text style={styles.loginButtonText}>{action}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  loginButton: {
    backgroundColor: '#673AB7',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  loginButtonDisabled: {
    backgroundColor: '#B39DDB',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
