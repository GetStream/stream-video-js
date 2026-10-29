import { Avatar, useChatContext } from 'stream-chat-react';
import { useCallback, useEffect, useState } from 'react';

import { produce } from 'immer';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

import type { UserResponseCommonFields as UserResponse } from 'stream-chat';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { meetingId } from '../../utils/meetingId';

const useGetUsers = () => {
  const { client } = useChatContext();

  return useCallback(
    () =>
      client
        .queryUsers({
          payload: {
            filter_conditions: {
              $or: [
                {
                  last_active: {
                    $gte: dayjs().subtract(10, 'minute').toDate(),
                  },
                },
                // FIXME: find proper solution for filtering online users
                // @ts-expect-error `online` is not in the generated filter type
                { online: true },
              ],
            },
          },
        })
        .then(({ users }) =>
          users.reduce<Record<string, UserResponse>>((userMap, user) => {
            if (user.id !== client.userId) userMap[user.id] = user;
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
    const { unsubscribe } = client.on('user.presence.changed', ({ user }) => {
      setUsers(
        produce((draft) => {
          const existing = draft[user.id];
          if (existing) {
            existing.online = user.online;
            existing.last_active = user.last_active;
          } else if (user.online && user.id !== client.userId) {
            draft[user.id] = user;
          }
        }),
      );
    });

    return unsubscribe;
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

type QuickDialButtonProps = {
  user: UserResponse;
};

const QuickDialButton = ({ user }: QuickDialButtonProps) => {
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
      <Avatar imageUrl={user.image as string} userName={user.name} size="md" />
    </button>
  );
};
