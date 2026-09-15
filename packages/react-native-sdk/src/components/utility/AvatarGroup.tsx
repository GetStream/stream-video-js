import { View, StyleSheet, Text } from 'react-native';
import { Avatar, type AvatarUser } from './Avatar';
import { useTheme } from '../../contexts';
import { Z_INDEX } from '../../constants';
import {
  AvatarGroupPosition,
  AvatarGroupSize,
  AvatarGroupStyle,
} from '../../theme/theme';

export type AvatarGroupProps = {
  /**
   * The users or participants to render avatars for. Both the coordinator
   * user models and `StreamVideoParticipant` satisfy `AvatarUser`, so either
   * array can be passed straight through.
   */
  users: AvatarUser[];
  size?: AvatarGroupSize;
};

const getItemStyle = (
  styleBase: AvatarGroupStyle,
  position: AvatarGroupPosition,
  size: AvatarGroupSize,
) => {
  return {
    container: {
      base: {
        ...styleBase[position],
        ...styleBase.item[size],
      },
    },
  };
};

export const AvatarGroup = ({ users, size = '2xl' }: AvatarGroupProps) => {
  const {
    theme: { avatarGroup },
  } = useTheme();

  const usersToShow = users.filter(Boolean);

  // the overflow branch below indexes the first two entries unconditionally,
  // so an empty list has nothing to render rather than a "+-2" placeholder
  if (usersToShow.length === 0) {
    return null;
  }

  if (usersToShow.length === 1) {
    return <Avatar user={usersToShow[0]!} size={size} />;
  }

  if (usersToShow.length == 2) {
    return (
      <View style={[styles.container, avatarGroup.container[size]]}>
        <Avatar
          style={getItemStyle(avatarGroup, 'top-left', size)}
          user={usersToShow[0]!}
        />
        <Avatar
          style={getItemStyle(avatarGroup, 'bottom-right', size)}
          user={usersToShow[1]!}
        />
      </View>
    );
  }

  if (usersToShow.length == 3) {
    return (
      <View style={[styles.container, avatarGroup.container[size]]}>
        <Avatar
          style={getItemStyle(avatarGroup, 'center-top', size)}
          user={usersToShow[0]!}
        />
        <Avatar
          style={getItemStyle(avatarGroup, 'bottom-left', size)}
          user={usersToShow[1]!}
        />
        <Avatar
          style={getItemStyle(avatarGroup, 'bottom-right', size)}
          user={usersToShow[2]!}
        />
      </View>
    );
  }

  if (usersToShow.length == 4) {
    return (
      <View style={[styles.container, avatarGroup.container[size]]}>
        <Avatar
          style={getItemStyle(avatarGroup, 'top-left', size)}
          user={usersToShow[0]!}
        />
        <Avatar
          style={getItemStyle(avatarGroup, 'top-right', size)}
          user={usersToShow[1]!}
        />
        <Avatar
          style={getItemStyle(avatarGroup, 'bottom-left', size)}
          user={usersToShow[2]!}
        />
        <Avatar
          style={getItemStyle(avatarGroup, 'bottom-right', size)}
          user={usersToShow[3]!}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, avatarGroup.container[size]]}>
      <Avatar
        style={getItemStyle(avatarGroup, 'top-left', size)}
        user={usersToShow[0]!}
      />
      <Avatar
        style={getItemStyle(avatarGroup, 'top-right', size)}
        user={usersToShow[1]!}
      />
      <View style={[styles.textContainer, avatarGroup.item[size]]}>
        <Text style={[avatarGroup.text.base, avatarGroup.text[size]]}>
          +{usersToShow.length - 2}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    position: 'absolute',
    bottom: 0,
    left: '25%',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    zIndex: Z_INDEX.IN_FRONT,
  },
});
