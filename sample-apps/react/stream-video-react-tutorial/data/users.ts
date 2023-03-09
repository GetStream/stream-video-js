import { User } from '@stream-io/video-react-sdk';

export default {
  alice: {
    id: 'alice',
    name: 'Alice',
    image: 'https://randomuser.me/api/portraits/women/47.jpg',
  },
  mark: {
    id: 'mark',
    name: 'Mark',
    image: 'https://randomuser.me/api/portraits/men/38.jpg',
  },
} as Record<string, User>;
