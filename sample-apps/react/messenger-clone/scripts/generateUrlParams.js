const { JWTUserToken } = require('stream-chat');
const fs = require('node:fs/promises');
const path = require('node:path');

require('dotenv').config();
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
    await fs.readFile(path.resolve('src', 'data', 'users.json'), 'utf-8'),
  );

  const user = users.find((u) => u.id === targetUserId);

  if (!user) {
    throw new Error(
      `Could not find the user with user id ${targetUserId} in src/data/users.json`,
    );
  }

  const token = JWTUserToken(secret, user.id, {
    name: user.name,
    image: user.image,
    exp: Math.round(Date.now() / 1000 + 3600 * 24 * 30), // in 30 days
  });

  console.log(new URLSearchParams({ user_id: targetUserId, token }).toString());
})();
