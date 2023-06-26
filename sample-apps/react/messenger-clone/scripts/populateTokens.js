const { JWTUserToken } = require('stream-chat');
const fs = require('node:fs/promises');
const path = require('node:path');

require('dotenv').config();

(async () => {
  const secret = process.env.VITE_STREAM_SECRET;
  const dataPath = path.resolve('data', 'users.json');

  const users = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

  for (const user of users) {
    user.token = JWTUserToken(secret, user.id, {
      exp: Math.round(Date.now() / 1000 + 3600 * 24 * 30), // in 30 days
    });
  }

  const usersWithTokens = JSON.stringify(users, null, 2);

  await fs
    .writeFile(dataPath, usersWithTokens)
    .then(() => console.log('Generated tokens for "data/users.json"'));
})();
