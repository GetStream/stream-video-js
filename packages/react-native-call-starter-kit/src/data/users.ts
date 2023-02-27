import {
  STREAM_TOKEN_ALICE,
  STREAM_TOKEN_BOB,
  STREAM_TOKEN_JANE,
  STREAM_TOKEN_JOHN,
  STREAM_TOKEN_MARK,
  STREAM_TOKEN_TAMARA,
} from 'react-native-dotenv';

export const users = [
  {
    id: 'alice',
    name: 'Alice',
    image: 'https://randomuser.me/api/portraits/women/47.jpg',
    token: STREAM_TOKEN_ALICE,
  },
  {
    id: 'mark',
    name: 'Mark',
    image: 'https://randomuser.me/api/portraits/men/38.jpg',
    token: STREAM_TOKEN_MARK,
  },
  {
    id: 'bob',
    name: 'Bob',
    image: 'https://randomuser.me/api/portraits/men/42.jpg',
    token: STREAM_TOKEN_BOB,
  },
  {
    id: 'jane',
    name: 'Jane',
    image: 'https://randomuser.me/api/portraits/women/60.jpg',
    token: STREAM_TOKEN_JANE,
  },
  {
    id: 'tamara',
    name: 'Tamara',
    image: 'https://randomuser.me/api/portraits/women/40.jpg',
    token: STREAM_TOKEN_TAMARA,
  },
  {
    id: 'john',
    name: 'John',
    image: 'https://randomuser.me/api/portraits/men/54.jpg',
    token: STREAM_TOKEN_JOHN,
  },
];
