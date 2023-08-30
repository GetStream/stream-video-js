import {
  USER_TOKEN_KHUSHAL,
  USER_TOKEN_SANTHOSH,
  USER_TOKEN_VISHAL,
} from 'react-native-dotenv';

const khushalToken = USER_TOKEN_KHUSHAL;
const santhoshToken = USER_TOKEN_SANTHOSH;
const vishalToken = USER_TOKEN_VISHAL;

console.log(khushalToken, santhoshToken, vishalToken);

export const users = [
  {
    id: 'khushal',
    name: 'Khushal',
    imageUrl:
      'https://ca.slack-edge.com/T02RM6X6B-U02DTREQ2KX-5d600c87d3bc-512',
    custom: {
      token: khushalToken,
    },
  },
  {
    id: 'santhosh',
    name: 'Santhosh',
    imageUrl:
      'https://ca.slack-edge.com/T02RM6X6B-U0359AX2TUY-dc7dbec0bb88-512',
    custom: {
      token: santhoshToken,
    },
  },
  {
    id: 'vishal',
    name: 'Vishal',
    imageUrl: 'https://ca.slack-edge.com/T02RM6X6B-UHGDQJ8A0-b4a6ca584e05-512',
    custom: {
      token: vishalToken,
    },
  },
];
