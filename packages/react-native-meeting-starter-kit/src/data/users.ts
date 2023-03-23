import {
  STREAM_TOKEN_BRIAN,
  STREAM_TOKEN_EVELYN,
  STREAM_TOKEN_JACK,
  STREAM_TOKEN_MICHAEL,
  STREAM_TOKEN_SARA,
  STREAM_TOKEN_TINA,
} from 'react-native-dotenv';

export const users = [
  {
    id: 'sara',
    name: 'Sara',
    imageUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
    custom: {
      token: STREAM_TOKEN_SARA,
    },
  },
  {
    id: 'michael',
    name: 'Michael',
    imageUrl: 'https://randomuser.me/api/portraits/men/44.jpg',
    custom: {
      token: STREAM_TOKEN_MICHAEL,
    },
  },
  {
    id: 'brian',
    name: 'Brian',
    imageUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
    token: STREAM_TOKEN_BRIAN,
  },
  {
    id: 'evelyn',
    name: 'Evelyn',
    imageUrl: 'https://randomuser.me/api/portraits/women/83.jpg',
    custom: {
      token: STREAM_TOKEN_EVELYN,
    },
  },
  {
    id: 'tina',
    name: 'Tina',
    imageUrl: 'https://randomuser.me/api/portraits/women/30.jpg',
    custom: {
      token: STREAM_TOKEN_TINA,
    },
  },
  {
    id: 'jack',
    name: 'Jack',
    imageUrl: 'https://randomuser.me/api/portraits/men/33.jpg',
    custom: {
      token: STREAM_TOKEN_JACK,
    },
  },
];
