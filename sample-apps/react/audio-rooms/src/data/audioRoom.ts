import users, { User } from './users';

export interface AudioRoom {
  id: string;
  title: string;
  subtitle: string;
  hosts: User[];
  listeners: User[];
  speakers: User[];
}

export const audioRooms: AudioRoom[] = [
  {
    id: 'demoAudioRoom1',
    title: 'The football room',
    subtitle: 'All about the beautiful game',
    hosts: [users[2], users[4]],
    listeners: [],
    speakers: [users[2], users[4]],
  },
  {
    id: 'demoAudioRoom2',
    title: 'iOS developers',
    subtitle: "Learn everything about Apple's platforms",
    hosts: [users[2], users[0]],
    listeners: [],
    speakers: [users[2], users[0]],
  },
  {
    id: 'demoAudioRoom3',
    title: 'Go developers',
    subtitle: 'We love Go',
    hosts: [users[1], users[0]],
    listeners: [],
    speakers: [users[1], users[0]],
  },
  {
    id: 'demoAudioRoom4',
    title: 'Balkan people',
    subtitle: 'Tales from the crazy region',
    hosts: [users[4], users[2]],
    listeners: [],
    speakers: [users[4], users[2]],
  },
];
