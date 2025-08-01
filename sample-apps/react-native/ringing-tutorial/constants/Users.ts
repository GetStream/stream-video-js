export type UserWithToken = {
  id: string;
  name: string;
  token: string;
};

export const Users: UserWithToken[] = [
  {
    id: 'user1',
    name: 'User 1',
    token: process.env.USER1_TOKEN || '',
  },
  {
    id: 'user2',
    name: 'User 2',
    token: process.env.USER2_TOKEN || '',
  },
  {
    id: 'user3',
    name: 'User 3',
    token: process.env.USER3_TOKEN || '',
  },
];
