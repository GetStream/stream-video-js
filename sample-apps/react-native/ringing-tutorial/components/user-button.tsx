import { type PressableProps, Pressable, StyleSheet, Text } from 'react-native';

type UserButtonProps = PressableProps & {
  userId: string;
  selected: boolean;
};

export const UserButton: React.FC<UserButtonProps> = ({
  userId,
  selected,
  onPress,
  ...rest
}) => {
  // Determine which color to use based on selection state
  const currentBorderColor = selected ? '#4CAF50' : '#757575';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.userButton,
        { borderColor: currentBorderColor },
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
      {...rest}
    >
      <Text style={[styles.userButtonText, { color: currentBorderColor }]}>
        {userId}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  userButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    minWidth: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  userButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
