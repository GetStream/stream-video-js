import { UserInput } from '@stream-io/video-client';

export default {
  alice: {
    id: 'alice',
    name: 'Alice',
    imageUrl: '/alice.jpg',
    role: 'user',
    teams: [],
    customJson: new Uint8Array(),
  },
  mark: {
    id: 'mark',
    name: 'Mark',
    imageUrl: '/mark.jpg',
    role: 'user',
    teams: [],
    customJson: new Uint8Array(),
  },
} as Record<string, UserInput>;
