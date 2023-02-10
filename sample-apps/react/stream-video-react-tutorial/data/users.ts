import { User } from '@stream-io/video-client';

export default {
  alice: {
    id: 'alice',
    name: 'Alice',
    imageUrl: '/alice.jpg',
    role: 'user',
    teams: [],
  },
  mark: {
    id: 'mark',
    name: 'Mark',
    imageUrl: '/mark.jpg',
    role: 'user',
    teams: [],
  },
} as Record<string, User>;
