import { FC } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text } from 'react-native';

type UserButtonProps = PressableProps & {
  userName: string;
  selected: boolean;
};

export const UserButton: FC<UserButtonProps> = ({
  userName,
  selected,
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
      {...rest}
    >
      <Text style={[styles.userButtonText, { color: currentBorderColor }]}>
        {userName}
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
