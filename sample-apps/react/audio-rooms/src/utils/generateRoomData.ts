import { User } from '../types';

export const generateRoomId = () => Math.random().toString(36).substring(2, 12);
export const generateRoomPayload = ({
  user,
  title,
  description,
}: {
  user: User;
  description?: string;
  title?: string;
}) => {
  const author = user.name || user.id;
  return {
    data: {
      members: [{ user_id: user.id, role: 'admin' }],
      custom: {
        title: title || `${author}'s Room`,
        description: description || `Room created by ${author}.`,
        hosts: [user],
      },
    },
  };
};
