import * as React from 'react';
import { StyleSheet, Text, Pressable, PressableProps } from 'react-native';

interface UserButtonProps extends PressableProps {
  userId: number;
  selected: boolean;
  color: string;
  label: string;
}

export const UserButton: React.FC<UserButtonProps> = ({
  userId,
  selected,
  color,
  label,
  onPress,
  ...rest
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.userButton,
        selected && styles.userButtonSelected,
        pressed && styles.userButtonPressed,
        { borderColor: color },
      ]}
      onPress={onPress}
      {...rest}
    >
      <Text style={[styles.userButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  userButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginBottom: 20,
    minWidth: 180,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  userButtonSelected: {
    backgroundColor: '#F5F5F5',
  },
  userButtonPressed: {
    opacity: 0.8,
    backgroundColor: '#F0F0F0',
  },
  userButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
