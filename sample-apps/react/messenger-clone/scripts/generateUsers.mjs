import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';

dotenv.config();

const userPairs = [
  [
    {
      id: 'alice',
      name: 'Alice',
      image: 'https://randomuser.me/api/portraits/women/47.jpg',
    },
    {
      id: 'mark',
      name: 'Mark',
      image: 'https://randomuser.me/api/portraits/men/38.jpg',
    },
  ],
  [
    {
      id: 'bob',
      name: 'Bob',
      image: 'https://randomuser.me/api/portraits/men/42.jpg',
    },
    {
      id: 'Jane',
      name: 'Jane',
      image: 'https://randomuser.me/api/portraits/women/60.jpg',
    },
  ],
  [
    {
      id: 'tamara',
      name: 'Tamara',
      image: 'https://randomuser.me/api/portraits/women/40.jpg',
    },
    {
      id: 'john',
      name: 'John',
      image: 'https://randomuser.me/api/portraits/men/54.jpg',
    },
  ],
];

const apiKey = process.env.VITE_STREAM_KEY;
const secret = process.env.VITE_STREAM_SECRET;

console.log(apiKey, secret);

const client = StreamChat.getInstance(apiKey, secret);

console.log('Creating users...');
await client.upsertUsers(userPairs.flat(1));

const channels = userPairs.map((userPair) =>
  client.channel('messaging', {
    members: userPair.map((user) => user.id),
  }),
);

console.log('Initiating a channel between two users...');

await Promise.allSettled(channels.map((c) => c.create()));

console.log('Finished initialization.');
