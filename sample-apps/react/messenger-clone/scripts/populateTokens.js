const { StreamClient } = require('@stream-io/node-sdk');
const fs = require('node:fs/promises');
const path = require('node:path');

require('dotenv').config();

(async () => {
  const key = process.env.VITE_STREAM_API_KEY;
  const secret = process.env.VITE_STREAM_SECRET;
  const client = new StreamClient(key, secret);
  const dataPath = path.resolve('data', 'users.json');

  const users = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

  for (const user of users) {
    user.token = client.generateUserToken({
      user_id: user.id,
      validity_in_seconds: 3600 * 24 * 30, // 30 days
    });
  }

  const usersWithTokens = JSON.stringify(users, null, 2);

  await fs
    .writeFile(dataPath, usersWithTokens)
    .then(() => console.log('Generated tokens for "data/users.json"'));
})();
