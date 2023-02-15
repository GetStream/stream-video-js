import { Avatar } from 'stream-chat-react';
import { useEffect, useState, MouseEvent, useCallback } from 'react';

import { produce } from 'immer';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

import type {
  Event,
  UserResponse,
  ExtendableGenerics,
  DefaultGenerics,
} from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

type QuickDialProps<SCG extends ExtendableGenerics = DefaultGenerics> = {
  onUserClick: (
    user: UserResponse<SCG>,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
};

const useGetUsers = () => {
  const { client } = useChatContext();

  return useCallback(
    () =>
      client
        .queryUsers({
          $or: [
            { last_active: { $gte: dayjs().subtract(10, 'minute').toJSON() } },
            // FIXME: find proper solution for filtering online users
            { online: true },
          ],
          id: { $nin: [client.user!.id] },
        })
        .then(({ users }) =>
          users.reduce<Record<string, UserResponse>>((userMap, user) => {
            userMap[user.id] = user;
            return userMap;
          }, {}),
        ),
    [client],
  );
};

export const QuickDial = <SCG extends ExtendableGenerics = DefaultGenerics>({
  onUserClick,
}: QuickDialProps<SCG>) => {
  const { client } = useChatContext();
  const getUsers = useGetUsers();

  const [users, setUsers] = useState<Record<string, UserResponse>>({});

  useEffect(() => {
    getUsers().then((userMap) => {
      setUsers(userMap);
    });
  }, [getUsers]);

  useEffect(() => {
    const updateUsers = (event: Event) => {
      const { user } = event;
      if (!user) return;
      if (!Object.hasOwn(users, user.id)) {
        return setUsers(
          produce((draft) => {
            draft[user.id] = user;
          }),
        );
      }

      setUsers(
        produce((draft) => {
          draft[user.id].online = user.online ?? false;
          draft[user.id].last_active = user.last_active;
        }),
      );
    };

    client.on('user.presence.changed', updateUsers);

    return () => {
      client.off('user.presence.changed', updateUsers);
    };
  }, [client]);

  if (!Object.values(users).length) return null;

  return (
    // FIXME: add horizontall scrolling
    <div className="quick-dial">
      {Object.values(users).map((user) => (
        <QuickDialButton key={user.id} user={user} onUserClick={onUserClick} />
      ))}
    </div>
  );
};

type QuickDialButtonProps<SCG extends ExtendableGenerics = DefaultGenerics> =
  Partial<Pick<QuickDialProps<SCG>, 'onUserClick'>> & {
    user: Parameters<QuickDialProps<SCG>['onUserClick']>['0'];
  };

const QuickDialButton = <SCG extends ExtendableGenerics = DefaultGenerics>({
  user,
  onUserClick,
}: QuickDialButtonProps<SCG>) => {
  return (
    <button
      onClick={(event) => onUserClick?.(user, event)}
      className={clsx('quick-dial-button', {
        online: user.online,
        away: !user.online,
      })}
    >
      <Avatar
        size={50}
        image={user.image as string}
        name={user.name}
        user={user}
      />
    </button>
  );
};
