import { Avatar, useChatContext } from 'stream-chat-react';
import { useCallback, useEffect, useState } from 'react';

import { produce } from 'immer';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

import type {
  DefaultGenerics,
  Event,
  ExtendableGenerics,
  UserResponse,
} from 'stream-chat';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { meetingId } from '../../utils/meetingId';

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

export const QuickDial = () => {
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
    <div className="quick-dial">
      {Object.values(users).map((user) => (
        <QuickDialButton key={user.id} user={user} />
      ))}
    </div>
  );
};

type QuickDialButtonProps<SCG extends ExtendableGenerics = DefaultGenerics> = {
  user: UserResponse<SCG>;
};

const QuickDialButton = <SCG extends ExtendableGenerics = DefaultGenerics>({
  user,
}: QuickDialButtonProps<SCG>) => {
  const videoClient = useStreamVideoClient();
  const createCall = useCallback(() => {
    videoClient?.call('default', meetingId()).getOrCreate({
      ring: true,
      data: {
        // custom: {
        //   channelId: channel.id,
        // },
        members: [
          {
            user_id: user.id,
          },
        ],
      },
    });
  }, [videoClient, user]);

  return (
    <button
      onClick={createCall}
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
