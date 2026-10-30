const { StreamClient } = require('@stream-io/node-sdk');
const fs = require('node:fs/promises');
const path = require('node:path');

require('dotenv').config();
const key = process.env.VITE_STREAM_API_KEY;
const secret = process.env.VITE_STREAM_SECRET;

(async () => {
  if (!secret) {
    throw new Error('Missing VITE_STREAM_SECRET in .env');
  }
  const targetUserId = process.argv[2];

  if (!targetUserId) {
    throw new Error('Pass user id string as a first argument to the script');
  }

  const users = JSON.parse(
    await fs.readFile(path.resolve('data', 'users.json'), 'utf-8'),
  );

  const user = users.find((u) => u.id === targetUserId);

  if (!user) {
    throw new Error(
      `Could not find the user with user id ${targetUserId} in data/users.json`,
    );
  }

  const client = new StreamClient(key, secret);
  const token = client.generateUserToken({
    user_id: user.id,
    name: user.name,
    image: user.image,
    validity_in_seconds: 3600 * 24 * 30, // 30 days
  });

  console.log(new URLSearchParams({ user_id: targetUserId, token }).toString());
})();
