export type UserWithToken = {
  id: string;
  name: string;
  token: string;
};

export const Users: UserWithToken[] = [
  {
    id: 'user1',
    name: 'User 1',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcjEifQ.eVDaUZJ7LL3jByFej17Jpuf7arq66go_J5DLbrsGyXs',
  },
  {
    id: 'user2',
    name: 'User 2',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcjIifQ.wm4Os9GgiqclP2ms_8kD_ROFbEy2-FhdkLBbJBDQidM',
  },
  {
    id: 'user3',
    name: 'User 3',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcjMifQ.cVkIRGhvsnkSoNd2f5DHDLdEK7q-j1z2XD7XiWJhXRM',
  },
];
